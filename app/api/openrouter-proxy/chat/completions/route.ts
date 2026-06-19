import { NextRequest, NextResponse } from "next/server";

// Models that require reasoning token storage. Per OpenRouter docs,
// reasoning_details must be preserved and re-submitted across tool calls for
// these reasoning models (Gemini, Moonshot/Kimi, MiniMax all require this).
const REASONING_MODELS = ["google/gemini-3.5-flash"];

// Reasoning configuration sent to OpenRouter for reasoning-capable models.
// The agent runs MANY inferences per build (one per tool call), and reasoning is
// the single largest latency cost — at the model's default (high) effort it can
// "think" for tens of seconds on EVERY call. We cap it to "low": the model still
// reasons, but briefly, which cuts per-inference latency dramatically while the
// strengthened design guidance in the system prompt carries output quality.
// Tune here (e.g. effort: "medium", or { max_tokens: 1024 }) in one place.
const REASONING_CONFIG = { effort: "low" as const };

/**
 * Check if a model requires reasoning tokens
 */
function requiresReasoningTokens(modelId: string): boolean {
  return REASONING_MODELS.some((m) => modelId.includes(m));
}

/**
 * Scans a teed copy of an SSE stream for a provider error chunk and logs it.
 * OpenRouter can return HTTP 200 while embedding `{ "error": ... }` in a
 * `data:` event mid-stream; AgentKit then only rethrows a generic message.
 * Parses each complete `data:` line as JSON and logs the first top-level
 * `error` it sees, avoiding false positives from the literal text "error"
 * appearing inside normal content deltas. Never throws into the request path.
 */
async function scanStreamForError(
  stream: ReadableStream<Uint8Array>,
  modelId: string
): Promise<void> {
  try {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let logged = false;
    let sawDone = false;
    let sawAnyData = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "") continue;
        if (payload === "[DONE]") {
          sawDone = true;
          continue;
        }
        sawAnyData = true;

        try {
          const parsed = JSON.parse(payload);
          // OpenRouter can surface a provider failure as a top-level `error`, a
          // per-choice `error`, or a `finish_reason` of "error"/"content_filter".
          // Check all three so the real cause is never swallowed.
          const choiceError = Array.isArray(parsed?.choices)
            ? parsed.choices.find(
                (c: Record<string, unknown>) =>
                  c?.error ||
                  c?.finish_reason === "error" ||
                  c?.finish_reason === "content_filter"
              )
            : undefined;
          const errorPayload = parsed?.error || choiceError?.error || choiceError;
          if (!logged && errorPayload) {
            logged = true;
            console.error(
              `[OpenRouter Proxy] Error chunk in 200 stream for model "${modelId}": ${JSON.stringify(
                errorPayload
              ).slice(0, 2000)}`
            );
          }
        } catch {
          // Partial or non-JSON data line; ignore.
        }
      }
    }

    // A well-formed OpenRouter stream ends with `data: [DONE]`. If it didn't —
    // and we never logged an explicit error chunk — the stream was likely cut
    // off mid-flight (provider drop, timeout), which AgentKit would otherwise
    // resurface only as a generic "Provider returned error".
    if (!logged && sawAnyData && !sawDone) {
      console.error(
        `[OpenRouter Proxy] Stream for model "${modelId}" ended without [DONE] and without an error chunk — likely a truncated/dropped provider response.`
      );
    }
  } catch (err) {
    console.error("[OpenRouter Proxy] Failed scanning stream for errors:", err);
  }
}

/**
 * Resolve the Convex HTTP (.site) endpoint used to durably store/fetch
 * reasoning_details. Mirrors getConvexHttpUrl() in inngest/functions.ts.
 *
 * This replaces the previous per-process in-memory Map, which was wiped on every
 * dev recompile and not shared across serverless instances — the root cause of
 * the intermittent "Provider returned error". Returns null if Convex isn't
 * configured, in which case the proxy gracefully degrades to disabling reasoning
 * on tool-call continuations.
 */
const getConvexHttpUrl = (): string | null => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return null;
  return convexUrl.replace(".convex.cloud", ".convex.site");
};

/**
 * Extract tool_call_ids from an assistant message
 */
function extractToolCallIds(message: Record<string, unknown>): string[] {
  const toolCalls = message.tool_calls as Array<{ id: string }> | undefined;
  if (!toolCalls || !Array.isArray(toolCalls)) return [];
  return toolCalls.map((tc) => tc.id).filter(Boolean);
}

/**
 * Inject reasoning_details into assistant messages that have tool_calls but are
 * missing reasoning_details, fetching them from the durable Convex store by
 * tool_call_id. Async because each lookup is an HTTP round-trip; failures are
 * swallowed so the caller falls through to graceful degradation.
 */
async function injectReasoningDetails(
  messages: Array<Record<string, unknown>>
): Promise<Array<Record<string, unknown>>> {
  const base = getConvexHttpUrl();
  if (!base) return messages;

  return await Promise.all(
    messages.map(async (msg) => {
      if (
        msg.role === "assistant" &&
        msg.tool_calls &&
        !msg.reasoning_details
      ) {
        const toolCallIds = extractToolCallIds(msg);
        if (toolCallIds.length === 0) return msg;
        try {
          const res = await fetch(`${base}/inngest/getReasoning`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ toolCallIds }),
          });
          if (res.ok) {
            const { details } = (await res.json()) as { details: unknown };
            if (details) {
              console.log(
                `[OpenRouter Proxy] Injected reasoning_details for tool_call_id: ${toolCallIds[0]}`
              );
              return { ...msg, reasoning_details: details };
            }
          }
        } catch (err) {
          console.error(
            "[OpenRouter Proxy] Failed to fetch reasoning_details from Convex:",
            err
          );
        }
      }
      return msg;
    })
  );
}

/**
 * Persist reasoning_details to the durable Convex store, keyed by tool_call_ids.
 * Best-effort: logs and continues on failure (the next continuation simply
 * degrades to reasoning-disabled rather than hard-failing).
 */
async function storeReasoningDetails(
  toolCallIds: string[],
  reasoningDetails: unknown
): Promise<void> {
  const base = getConvexHttpUrl();
  if (!base || toolCallIds.length === 0) return;
  try {
    await fetch(`${base}/inngest/storeReasoning`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolCallIds, details: reasoningDetails }),
    });
    console.log(
      `[OpenRouter Proxy] Stored reasoning_details for tool_call_ids: ${toolCallIds.join(
        ", "
      )}`
    );
  } catch (err) {
    console.error(
      "[OpenRouter Proxy] Failed to store reasoning_details to Convex:",
      err
    );
  }
}

/**
 * Returns true if any assistant message has tool_calls but no reasoning_details.
 * OpenRouter rejects reasoning models in this state, so it signals that we could
 * not satisfy the preservation requirement for this request.
 */
function hasUnresolvedReasoning(
  messages: Array<Record<string, unknown>>
): boolean {
  return messages.some(
    (m) =>
      m.role === "assistant" &&
      Array.isArray(m.tool_calls) &&
      (m.tool_calls as unknown[]).length > 0 &&
      !m.reasoning_details
  );
}

/**
 * Removes reasoning fields from every message so a request is internally
 * consistent with reasoning disabled. Used to gracefully degrade a tool-call
 * continuation we can't supply reasoning_details for, instead of letting
 * OpenRouter hard-fail with "Provider returned error".
 */
function stripReasoningDetails(
  messages: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  return messages.map((m) => {
    if ("reasoning_details" in m || "reasoning" in m) {
      const clone = { ...m };
      delete clone.reasoning_details;
      delete clone.reasoning;
      return clone;
    }
    return m;
  });
}

/**
 * Proxy endpoint for OpenRouter API calls
 * Adds reasoning parameter for reasoning models that require it
 * Also handles reasoning_details preservation for tool calls
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // The agent encodes "reasoning off" as a ":noreason" model suffix (default is
    // OFF, set by the UI toggle). Strip it here, forward the clean model id to
    // OpenRouter, and only treat this as a reasoning request when it was NOT
    // explicitly disabled.
    const rawModel = (body.model as string) || "";
    const reasoningDisabled = /:noreason$/.test(rawModel);
    const modelId = rawModel.replace(/:noreason$/, "");
    const messages = body.messages as
      | Array<Record<string, unknown>>
      | undefined;
    const isReasoningModel =
      !!modelId && requiresReasoningTokens(modelId) && !reasoningDisabled;

    // Entry log: confirms the proxy is actually in the request path and shows
    // the request shape. If this line never appears in the dev terminal during
    // a failure, the model call is bypassing the proxy (e.g. a misconfigured
    // NEXT_PUBLIC_APP_URL) rather than failing inside it.
    const hasToolResults = !!messages?.some((m) => m.role === "tool");
    console.log(
      `[OpenRouter Proxy] Request: model="${modelId}", stream=${!!body.stream}, messages=${
        messages?.length ?? 0
      }, reasoningModel=${!!isReasoningModel}, toolResults=${hasToolResults}, convexStore=${!!getConvexHttpUrl()}`
    );

    // Build the request body for OpenRouter, forwarding the cleaned model id
    // (suffix stripped) so OpenRouter always receives a valid model.
    const openrouterBody = { ...body, model: modelId };

    // Add reasoning parameter for models that require it
    if (isReasoningModel) {
      if (messages && messages.length > 0 && hasToolResults) {
        // Tool-call continuation: OpenRouter requires the prior assistant
        // message's reasoning_details to be re-submitted. Try to restore them
        // from the durable store first.
        const injected = await injectReasoningDetails(messages);

        if (hasUnresolvedReasoning(injected)) {
          // We couldn't supply reasoning_details for at least one tool-call
          // message (the store is cold — e.g. they were produced on the
          // streaming path and never captured). Enabling reasoning now would
          // make OpenRouter hard-fail with "Provider returned error". Degrade
          // gracefully: strip reasoning everywhere and leave reasoning disabled
          // for this turn so the continuation is a valid plain completion.
          console.warn(
            `[OpenRouter Proxy] Missing reasoning_details on a tool-call continuation for model "${modelId}"; disabling reasoning for this request to avoid a provider rejection.`
          );
          openrouterBody.messages = stripReasoningDetails(injected);
        } else {
          openrouterBody.reasoning = REASONING_CONFIG;
          openrouterBody.messages = injected;
        }
      } else {
        // First turn (no tool results): enable reasoning. This is the turn the
        // reasoning "thinking" stream renders from.
        openrouterBody.reasoning = REASONING_CONFIG;
      }
    }

    // Get the authorization header from the request (passed by AgentKit)
    const authHeader = req.headers.get("authorization");

    // Forward the request to OpenRouter
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization:
            authHeader || `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "OpenCraft",
        },
        body: JSON.stringify(openrouterBody),
      }
    );

    // Surface upstream errors with full detail. Without this, AgentKit only
    // sees a generic "Provider returned error / 500" and the real cause
    // (provider outage, content policy, token limit, bad reasoning_details
    // sequence, etc.) is lost. Read the body once as text and forward it
    // verbatim with the original status so retry behavior is unchanged.
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[OpenRouter Proxy] Upstream ${response.status} for model "${modelId}": ${errorBody.slice(
          0,
          2000
        )}`
      );
      return new NextResponse(errorBody, {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("content-type") || "application/json",
        },
      });
    }

    // Check if it's a streaming response
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("text/event-stream")) {
      // For streaming, we can't easily extract reasoning_details, so the body
      // is returned as-is. OpenRouter can, however, embed a provider error in
      // an otherwise-200 SSE stream — which AgentKit only resurfaces as a
      // generic "Provider returned error". Tee the stream so one branch is
      // delivered to the caller untouched while the other is scanned to log the
      // real error for diagnosis.
      if (response.body) {
        const [clientStream, logStream] = response.body.tee();
        void scanStreamForError(logStream, modelId);
        return new NextResponse(clientStream, {
          status: response.status,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Return JSON response
    const data = await response.json();

    // Surface a provider error embedded in an otherwise-200 JSON response so the
    // real cause is visible instead of AgentKit's generic "Provider returned error".
    if (data?.error) {
      console.error(
        `[OpenRouter Proxy] Error in 200 JSON response for model "${modelId}": ${JSON.stringify(
          data.error
        ).slice(0, 2000)}`
      );
    }

    // For reasoning models, store the reasoning_details for future requests
    // Key by tool_call_ids so we can match them when tool results come back
    if (isReasoningModel && data.choices?.[0]?.message) {
      const assistantMessage = data.choices[0].message;
      const reasoningDetails = assistantMessage.reasoning_details;
      const toolCallIds = extractToolCallIds(assistantMessage);

      if (reasoningDetails && toolCallIds.length > 0) {
        await storeReasoningDetails(toolCallIds, reasoningDetails);
      }
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("OpenRouter proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy error" },
      { status: 500 }
    );
  }
}
