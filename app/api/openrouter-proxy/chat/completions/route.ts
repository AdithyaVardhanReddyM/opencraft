import { NextRequest, NextResponse } from "next/server";

// Models that require reasoning token storage (Gemini 3 Pro)
const REASONING_MODELS = ["google/gemini-3-pro-preview"];

/**
 * Check if a model requires reasoning tokens
 */
function requiresReasoningTokens(modelId: string): boolean {
  return REASONING_MODELS.some((m) => modelId.includes(m));
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
 * Proxy endpoint for OpenRouter API calls
 * Adds reasoning parameter for models that require it (Gemini 3 Pro)
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

    // Build the request body for OpenRouter
    const openrouterBody = { ...body };

    // Add reasoning parameter for models that require it
    if (isReasoningModel) {
      openrouterBody.reasoning = { enabled: true };

      // For reasoning models, check if we need to inject stored reasoning_details
      if (messages && messages.length > 0) {
        // Check if there are tool results in the messages (indicating a tool call continuation)
        const hasToolResults = messages.some((m) => m.role === "tool");

        if (hasToolResults) {
          // Inject reasoning_details into assistant messages that need them
          openrouterBody.messages = injectReasoningDetails(messages);
        }
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
          "X-Title": "Unit Set",
        },
        body: JSON.stringify(openrouterBody),
      }
    );

    // Check if it's a streaming response
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("text/event-stream")) {
      // For streaming, we can't easily extract reasoning_details
      // Return streaming response as-is
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
