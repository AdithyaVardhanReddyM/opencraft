import { NextRequest, NextResponse } from "next/server";

// Models that require reasoning token storage. Per OpenRouter docs,
// reasoning_details must be preserved and re-submitted across tool calls for
// these reasoning models (Gemini, Moonshot/Kimi, MiniMax all require this).
const REASONING_MODELS = [
  "google/gemini-3.5-flash",
  "moonshotai/kimi-k2.7-code",
  "minimax/minimax-m3",
];

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
        if (payload === "" || payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload);
          if (!logged && parsed?.error) {
            logged = true;
            console.error(
              `[OpenRouter Proxy] Error chunk in 200 stream for model "${modelId}": ${JSON.stringify(
                parsed.error
              ).slice(0, 2000)}`
            );
          }
        } catch {
          // Partial or non-JSON data line; ignore.
        }
      }
    }
  } catch (err) {
    console.error("[OpenRouter Proxy] Failed scanning stream for errors:", err);
  }
}

/**
 * In-memory store for reasoning_details keyed by tool_call_id
 * This allows us to match reasoning_details to the correct assistant message
 * when tool results come back
 *
 * Note: In production, consider using Redis or similar for multi-instance support
 */
const reasoningStoreByToolCallId = new Map<string, unknown[]>();

/**
 * Extract tool_call_ids from an assistant message
 */
function extractToolCallIds(message: Record<string, unknown>): string[] {
  const toolCalls = message.tool_calls as Array<{ id: string }> | undefined;
  if (!toolCalls || !Array.isArray(toolCalls)) return [];
  return toolCalls.map((tc) => tc.id).filter(Boolean);
}

/**
 * Inject reasoning_details into assistant messages that are missing them
 * Matches by tool_call_id to ensure correct pairing
 */
function injectReasoningDetails(
  messages: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  return messages.map((msg) => {
    // Only process assistant messages with tool_calls but no reasoning_details
    if (msg.role === "assistant" && msg.tool_calls && !msg.reasoning_details) {
      const toolCallIds = extractToolCallIds(msg);

      // Try to find stored reasoning_details for any of the tool_call_ids
      for (const toolCallId of toolCallIds) {
        const storedReasoningDetails =
          reasoningStoreByToolCallId.get(toolCallId);
        if (storedReasoningDetails) {
          console.log(
            `[OpenRouter Proxy] Injecting reasoning_details for tool_call_id: ${toolCallId}`
          );
          return {
            ...msg,
            reasoning_details: storedReasoningDetails,
          };
        }
      }
    }
    return msg;
  });
}

/**
 * Store reasoning_details keyed by tool_call_ids
 */
function storeReasoningDetails(
  toolCallIds: string[],
  reasoningDetails: unknown[]
): void {
  for (const toolCallId of toolCallIds) {
    reasoningStoreByToolCallId.set(toolCallId, reasoningDetails);
    console.log(
      `[OpenRouter Proxy] Stored reasoning_details for tool_call_id: ${toolCallId}`
    );
  }

  // Clean up old entries (keep only last 500)
  if (reasoningStoreByToolCallId.size > 500) {
    const keysToDelete = Array.from(reasoningStoreByToolCallId.keys()).slice(
      0,
      100
    );
    for (const key of keysToDelete) {
      reasoningStoreByToolCallId.delete(key);
    }
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
    const modelId = body.model as string;
    const messages = body.messages as
      | Array<Record<string, unknown>>
      | undefined;
    const isReasoningModel = modelId && requiresReasoningTokens(modelId);

    // Entry log: confirms the proxy is actually in the request path and shows
    // the request shape. If this line never appears in the dev terminal during
    // a failure, the model call is bypassing the proxy (e.g. a misconfigured
    // NEXT_PUBLIC_APP_URL) rather than failing inside it.
    const hasToolResults = !!messages?.some((m) => m.role === "tool");
    console.log(
      `[OpenRouter Proxy] Request: model="${modelId}", stream=${!!body.stream}, messages=${
        messages?.length ?? 0
      }, reasoningModel=${!!isReasoningModel}, toolResults=${hasToolResults}`
    );

    // Build the request body for OpenRouter
    const openrouterBody = { ...body };

    // Add reasoning parameter for models that require it
    if (isReasoningModel) {
      if (messages && messages.length > 0 && hasToolResults) {
        // Tool-call continuation: OpenRouter requires the prior assistant
        // message's reasoning_details to be re-submitted. Try to restore them
        // from the store first.
        const injected = injectReasoningDetails(messages);

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
          openrouterBody.reasoning = { enabled: true };
          openrouterBody.messages = injected;
        }
      } else {
        // First turn (no tool results): enable reasoning normally. This is the
        // turn the reasoning "thinking" stream renders from.
        openrouterBody.reasoning = { enabled: true };
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
        storeReasoningDetails(toolCallIds, reasoningDetails);
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
