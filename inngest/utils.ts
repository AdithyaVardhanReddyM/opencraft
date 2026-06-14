import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, TextMessage, Message } from "@inngest/agent-kit";

/**
 * Message record from Convex database
 */
export interface ConvexMessage {
  _id: string;
  screenId: string;
  role: "user" | "assistant";
  content: string;
  reasoningDetails?: unknown; // Reasoning details for models like Gemini 3 Pro
  createdAt: number;
}

/**
 * Screen record from Convex database
 */
export interface ConvexScreen {
  _id: string;
  shapeId: string;
  projectId: string;
  title?: string;
  sandboxUrl?: string;
  sandboxId?: string;
  files?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Connect to an existing sandbox
 */
export async function getSandbox(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId);
  return sandbox;
}

/**
 * Extract the last assistant text message content from agent result
 */
export function lastAssistantTextMessageContent(result: AgentResult) {
  const lastAssistantTextMessageIndex = result.output.findLastIndex(
    (message) => message.role === "assistant"
  );

  const message = result.output[lastAssistantTextMessageIndex] as
    | TextMessage
    | undefined;

  return message?.content
    ? typeof message.content === "string"
      ? message.content
      : message.content.map((c) => c.text).join("")
    : undefined;
}

/**
 * Extended message type that includes reasoning_details for models like Gemini 3 Pro
 * We use intersection type to ensure compatibility with Message while adding reasoning_details
 */
export type ExtendedMessage = Message & {
  reasoning_details?: unknown;
};

/**
 * Format Convex messages for agent context
 * Transforms database messages to AgentKit Message format
 * Preserves order and content including files_summary and reasoning_details
 * Returns Message[] for compatibility with AgentKit, but includes reasoning_details when present
 */
export function formatMessagesForAgent(messages: ConvexMessage[]): Message[] {
  return messages.map((msg) => {
    // Base message structure matching TextMessage type
    const baseMessage: TextMessage = {
      type: "text" as const,
      role: msg.role,
      content: msg.content,
    };

    // Include reasoning_details if present (required for Gemini 3 Pro multi-turn)
    // This is passed through to the API even though it's not in the Message type
    // We cast to unknown first then to Message to allow the extra property
    if (msg.reasoningDetails) {
      return {
        ...baseMessage,
        reasoning_details: msg.reasoningDetails,
      } as unknown as Message;
    }

    return baseMessage;
  });
}

/**
 * Determine if a new sandbox should be created based on screen state
 * Returns true if sandboxId is null, undefined, or empty string
 */
export function shouldCreateNewSandbox(screen: ConvexScreen | null): boolean {
  if (!screen) {
    return true;
  }
  return !screen.sandboxId || screen.sandboxId.trim() === "";
}

/**
 * Parse files_summary from message content
 * Extracts the content between <files_summary> tags
 */
export function parseFilesSummary(content: string): string | null {
  const match = content.match(/<files_summary>([\s\S]*?)<\/files_summary>/);
  return match ? match[1].trim() : null;
}
