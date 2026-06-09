/**
 * Streaming utilities for mapping AgentKit events to UI states.
 * Used by AISidebar to display real-time status during agent execution.
 */

export type StreamingStatus = "ready" | "submitted" | "streaming" | "error";

export type AgentKitEventType =
  | "run.started"
  | "run.completed"
  | "stream.ended"
  | "part.created"
  | "text.delta"
  | "part.completed"
  | "tool_call.arguments.delta"
  | "tool_call.output.delta";

export interface AgentKitEvent {
  event: string;
  data?: Record<string, unknown>;
}

export interface StreamingState {
  status: StreamingStatus;
  statusText: string;
}

// Tool name mappings for human-readable display
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  terminal: "Executing command",
  createOrUpdateFiles: "Writing code",
  readFiles: "Reading files",
};

/**
 * Converts a tool name to a human-readable format.
 * Handles camelCase and snake_case conversion.
 */
export function formatToolName(toolName: string): string {
  // Check for known tool mappings first
  if (TOOL_DISPLAY_NAMES[toolName]) {
    return TOOL_DISPLAY_NAMES[toolName];
  }

  // Convert camelCase or snake_case to readable format
  const readable = toolName
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();

  // Capitalize first letter and truncate if needed
  const formatted = readable.charAt(0).toUpperCase() + readable.slice(1);

  // Ensure max 30 characters
  if (formatted.length > 25) {
    return formatted.substring(0, 22) + "...";
  }

  return formatted;
}

/**
 * Gets human-readable status text for an AgentKit event.
 * Shows detailed progress for tool calls and agent operations.
 */
export function getStatusTextForEvent(event: AgentKitEvent): string {
  const eventType = event.event;
  const data = event.data || {};

  switch (eventType) {
    case "run.started":
      return "Updating";

    case "text.delta":
      return "Composing response";

    case "tool_call.arguments.delta": {
      const toolName = data.toolName as string | undefined;
      if (toolName) {
        return formatToolName(toolName);
      }
      return "Preparing action";
    }

    case "tool_call.output.delta": {
      const toolName = data.toolName as string | undefined;
      if (toolName === "terminal") {
        return "Running in terminal";
      }
      if (toolName === "createOrUpdateFiles") {
        return "Saving changes";
      }
      if (toolName === "readFiles") {
        return "Scanning files";
      }
      return "Processing result";
    }

    case "part.created": {
      const partType = data.type as string | undefined;
      if (partType === "tool-call") {
        const toolName = data.toolName as string | undefined;
        if (toolName === "terminal") {
          return "Opening terminal";
        }
        if (toolName === "createOrUpdateFiles") {
          return "Preparing files";
        }
        if (toolName === "readFiles") {
          return "Locating files";
        }
        return "Invoking tool";
      }
      if (partType === "text") {
        return "Generating";
      }
      return "Working";
    }

    case "part.completed": {
      const partType = data.type as string | undefined;
      if (partType === "tool-call") {
        return "Tool call";
      }
      return "Step complete";
    }

    case "run.completed":
      return "Wrapping up";

    case "stream.ended":
      return "Done";

    // Network-level events
    case "network.started":
      return "Initializing";

    case "network.completed":
      return "Finished";

    case "agent.started":
      return "Reasoning";

    case "agent.completed":
      return "Ready";

    default:
      // Handle any unknown events gracefully
      if (eventType.includes("tool")) {
        return "Using tools";
      }
      if (eventType.includes("text")) {
        return "Writing";
      }
      return "Working";
  }
}

/**
 * Maps an AgentKit event to a StreamingStatus.
 * Returns the appropriate UI state based on the event type.
 */
export function mapEventToStatus(event: AgentKitEvent): StreamingStatus {
  const eventType = event.event;

  switch (eventType) {
    case "run.started":
      return "streaming";

    case "text.delta":
    case "tool_call.arguments.delta":
    case "tool_call.output.delta":
    case "part.created":
    case "part.completed":
      return "streaming";

    case "run.completed":
      return "streaming"; // Still streaming until stream.ended

    case "stream.ended":
      return "ready";

    default:
      // Check for error in data
      if (event.data?.error as string | undefined) {
        return "error";
      }
      return "streaming";
  }
}

/**
 * Gets the complete streaming state from an event.
 * Combines status and status text for UI rendering.
 */
export function getStreamingState(event: AgentKitEvent): StreamingState {
  return {
    status: mapEventToStatus(event),
    statusText: getStatusTextForEvent(event),
  };
}
