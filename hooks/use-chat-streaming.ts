"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAgents } from "@inngest/use-agent";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getStatusTextForEvent } from "@/lib/streaming-utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
  isStreaming?: boolean;
}

export interface UseChatStreamingOptions {
  screenId?: string;
  projectId?: string;
}

export type StreamingStatus = "ready" | "submitted" | "streaming" | "error";

export interface StreamingStep {
  id: string;
  text: string;
  status: "pending" | "complete";
  timestamp: Date;
}

export interface UseChatStreamingReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  status: StreamingStatus;
  statusText: string;
  streamingSteps: StreamingStep[];
  error: { message: string; canRetry: boolean } | null;
  sendMessage: (content: string) => Promise<void>;
  retryLastMessage: () => void;
}

// Strip files_summary tags from message content for display
function stripFilesSummary(content: string): string {
  return content
    .replace(/<files_summary>[\s\S]*?<\/files_summary>/g, "")
    .replace(/<task_summary>[\s\S]*?<\/task_summary>/g, "")
    .trim();
}

// Client state type sent with each message
interface ClientState {
  screenId: string;
  projectId: string;
}

/**
 * Custom hook for chat with real-time streaming support using @inngest/use-agent.
 * Receives actual streaming events from the agent and displays tool calls in real-time.
 */
export function useChatStreaming({
  screenId,
  projectId,
}: UseChatStreamingOptions): UseChatStreamingReturn {
  const [statusText, setStatusText] = useState("");
  const [streamingSteps, setStreamingSteps] = useState<StreamingStep[]>([]);
  const [error, setError] = useState<{
    message: string;
    canRetry: boolean;
    originalMessage?: string;
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const lastMessageRef = useRef<string>("");
  const prevScreenIdRef = useRef<string | undefined>(screenId);
  const pendingUserMessageRef = useRef<string | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const lastConvexMessageCountRef = useRef<number>(0);

  // Convex mutations and queries for persistence
  const createMessage = useMutation(api.messages.createMessage);
  const convexMessages = useQuery(
    api.messages.getMessages,
    screenId ? { screenId: screenId as Id<"screens"> } : "skip"
  );

  // Use the useAgents hook from @inngest/use-agent (note: plural)
  // Don't pass channelKey - let it use userId from AgentProvider (default behavior)
  const {
    messages: agentMessages,
    status: agentStatus,
    sendMessage: agentSendMessage,
    error: agentError,
  } = useAgents({
    // channelKey is intentionally omitted - useAgents will use userId from AgentProvider
    state: (): ClientState => ({
      screenId: screenId || "",
      projectId: projectId || "",
    }),
    onEvent: (event) => {
      // Map the event to a status text for display
      const text = getStatusTextForEvent({
        event: event.event,
        data: event.data as Record<string, unknown>,
      });
      setStatusText(text);

      // Track streaming steps for history display
      const eventType = event.event;

      // Mark previous step as complete when a new major step starts
      if (eventType === "run.started" || eventType === "part.created") {
        setStreamingSteps((prev) => {
          // Mark all pending steps as complete
          const updated = prev.map((s) =>
            s.status === "pending" ? { ...s, status: "complete" as const } : s
          );
          // Add new step
          return [
            ...updated,
            {
              id: `${eventType}-${Date.now()}`,
              text,
              status: "pending" as const,
              timestamp: new Date(),
            },
          ];
        });
      } else if (
        eventType === "run.completed" ||
        eventType === "stream.ended"
      ) {
        // Mark all steps as complete
        setStreamingSteps((prev) =>
          prev.map((s) => ({ ...s, status: "complete" as const }))
        );
      } else if (text !== statusText) {
        // Update current step text for intermediate events
        setStreamingSteps((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last.status === "pending") {
            return [...prev.slice(0, -1), { ...last, text }];
          }
          return prev;
        });
      }
    },
    debug: false,
  });

  // Handle agent errors
  useEffect(() => {
    if (agentError) {
      setError({
        message: agentError.message || "An error occurred",
        canRetry: true,
      });
    }
  }, [agentError]);

  // Convert Convex messages to local format (for history)
  const convexFormattedMessages: ChatMessage[] = useMemo(
    () =>
      convexMessages?.map((msg) => ({
        id: msg._id,
        role: msg.role,
        content: stripFilesSummary(msg.content),
        timestamp: new Date(msg.createdAt),
      })) ?? [],
    [convexMessages]
  );

  // Convert agent messages to our format (only assistant messages - user messages come from Convex)
  const streamingMessages: ChatMessage[] = useMemo(() => {
    return agentMessages
      .filter((msg) => msg.role === "assistant") // Only assistant messages from streaming
      .map((msg) => {
        // Extract text content from parts
        let textContent = "";
        let isStreaming = false;

        for (const part of msg.parts) {
          if (part.type === "text") {
            // Access content safely
            const textPart = part as {
              type: "text";
              content?: string;
              status?: string;
            };
            textContent += textPart.content || "";
            if (textPart.status === "streaming") {
              isStreaming = true;
            }
          }
        }

        return {
          id: msg.id,
          role: msg.role,
          content: stripFilesSummary(textContent),
          timestamp: msg.timestamp,
          isStreaming,
        };
      });
  }, [agentMessages]);

  // Merge messages: use Convex for persisted history, agent for current streaming
  const messages = useMemo(() => {
    // useAgents returns: "ready" | "submitted" | "streaming" | "error"
    const isReady = agentStatus === "ready";

    // If we have streaming messages and agent is not ready, prefer streaming messages
    if (streamingMessages.length > 0 && !isReady) {
      // Merge: Convex history + streaming messages (avoiding duplicates)
      const convexIds = new Set(convexFormattedMessages.map((m) => m.id));
      const newStreamingMessages = streamingMessages.filter(
        (m) => !convexIds.has(m.id)
      );
      return [...convexFormattedMessages, ...newStreamingMessages];
    }

    // When ready, just show Convex messages (they're the source of truth)
    return convexFormattedMessages;
  }, [convexFormattedMessages, streamingMessages, agentStatus]);

  // Detect completion by watching for new assistant message in Convex
  // This is more reliable than useAgents status which may not transition to "ready"
  useEffect(() => {
    if (!convexMessages || !isWaitingForResponse) return;

    const currentCount = convexMessages.length;
    const lastMessage = convexMessages[convexMessages.length - 1];

    // Check if we got a new assistant message (response arrived)
    if (
      currentCount > lastConvexMessageCountRef.current &&
      lastMessage?.role === "assistant"
    ) {
      // Response received! Clear loading state
      setIsWaitingForResponse(false);
      setStreamingSteps([]);
      setStatusText("");
    }

    lastConvexMessageCountRef.current = currentCount;
  }, [convexMessages, isWaitingForResponse]);

  // Use our own loading state based on waiting for response
  const isLoading = isWaitingForResponse;

  // Map to status for UI
  const status: StreamingStatus = isWaitingForResponse ? "streaming" : "ready";

  // Handle loading history state
  useEffect(() => {
    if (!screenId) {
      setIsLoadingHistory(false);
      return;
    }

    if (convexMessages === undefined) {
      setIsLoadingHistory(true);
      return;
    }

    setIsLoadingHistory(false);
  }, [convexMessages, screenId]);

  // Reset state when screen changes
  useEffect(() => {
    if (prevScreenIdRef.current !== screenId) {
      setError(null);
      setStatusText("");
      setIsLoadingHistory(!!screenId);
      prevScreenIdRef.current = screenId;
    }
  }, [screenId]);

  // Send message - saves to Convex and triggers agent via useAgents hook
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmedContent = content.trim();
      if (!trimmedContent || isLoading) return;

      if (!screenId || !projectId) {
        setError({
          message: "Please select a screen to chat with AI",
          canRetry: false,
        });
        return;
      }

      setError(null);
      lastMessageRef.current = trimmedContent;
      pendingUserMessageRef.current = trimmedContent;
      setStatusText("Starting...");
      setStreamingSteps([]); // Clear previous steps
      setIsWaitingForResponse(true); // Start waiting for response
      lastConvexMessageCountRef.current = convexMessages?.length || 0;

      try {
        // Save user message to Convex first
        await createMessage({
          screenId: screenId as Id<"screens">,
          role: "user",
          content: trimmedContent,
        });

        // Update count after user message is saved
        lastConvexMessageCountRef.current = (convexMessages?.length || 0) + 1;

        // Send message via the useAgents hook (this triggers the streaming)
        await agentSendMessage(trimmedContent);

        // Note: isWaitingForResponse will be cleared when Convex receives assistant message
        pendingUserMessageRef.current = null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";

        setError({
          message: errorMessage,
          canRetry: true,
          originalMessage: trimmedContent,
        });
        setStatusText("");
        setIsWaitingForResponse(false); // Clear waiting state on error
        setStreamingSteps([]);
      }
    },
    [
      isLoading,
      screenId,
      projectId,
      createMessage,
      agentSendMessage,
      convexMessages?.length,
    ]
  );

  // Retry last message
  const retryLastMessage = useCallback(() => {
    if (!error?.canRetry || !error.originalMessage) return;
    sendMessage(error.originalMessage);
  }, [error, sendMessage]);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    status,
    statusText,
    streamingSteps,
    error: error ? { message: error.message, canRetry: error.canRetry } : null,
    sendMessage,
    retryLastMessage,
  };
}
