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
  imageIds?: string[];
  modelId?: string;
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

/** Image attachment for sending with messages */
export interface ImageAttachment {
  id: string;
  file: File;
  previewUrl: string;
  storageId?: string;
}

/** Options for sending a message */
export interface SendMessageOptions {
  modelId?: string;
  images?: ImageAttachment[];
}

export interface UseChatStreamingReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  status: StreamingStatus;
  statusText: string;
  streamingSteps: StreamingStep[];
  error: { message: string; canRetry: boolean } | null;
  sendMessage: (content: string, options?: SendMessageOptions) => Promise<void>;
  retryLastMessage: () => void;
}

// Strip the agent's structured tags from message content for display.
// Mirrors the server-side cleanup in inngest/functions.ts so streamed text and
// persisted messages render identically. <task_summary> wraps the visible
// content, so only its tags are removed; <title> and <files_summary> are hidden
// sections, so their full blocks are removed. The trailing open-ended replaces
// handle partially-streamed tags (closing tag not yet received) so a hidden
// section's content never flashes mid-stream.
function stripFilesSummary(content: string): string {
  return content
    .replace(/<\/?task_summary>/gi, "")
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<files_summary>[\s\S]*?<\/files_summary>/gi, "")
    .replace(/<title>[\s\S]*$/i, "")
    .replace(/<files_summary>[\s\S]*$/i, "")
    .trim();
}

// Client state type sent with each message
interface ClientState {
  screenId: string;
  projectId: string;
  modelId?: string;
  imageUrls?: string[];
}

// Convert file to base64 data URL
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const lastStatusTextRef = useRef<string>("");

  // Convex mutations and queries for persistence
  const createMessage = useMutation(api.messages.createMessage);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const convexMessages = useQuery(
    api.messages.getMessages,
    screenId ? { screenId: screenId as Id<"screens"> } : "skip"
  );

  // Track current model and images for retry and state
  const lastOptionsRef = useRef<SendMessageOptions | undefined>(undefined);
  const currentModelIdRef = useRef<string | undefined>(undefined);
  const currentImageUrlsRef = useRef<string[]>([]);

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
      modelId: currentModelIdRef.current,
      imageUrls: currentImageUrlsRef.current,
    }),
    onEvent: (event) => {
      const eventType = event.event;

      // Map the event to a status text for display
      const text = getStatusTextForEvent({
        event: eventType,
        data: event.data as Record<string, unknown>,
      });

      const prevText = lastStatusTextRef.current;
      lastStatusTextRef.current = text;
      setStatusText(text);

      // Only stream.ended should mark everything complete
      if (eventType === "stream.ended") {
        setStreamingSteps((prev) =>
          prev.map((s) => ({ ...s, status: "complete" as const }))
        );
        return;
      }

      // For part.created - this is a new meaningful step, mark previous complete and add new
      if (eventType === "part.created") {
        setStreamingSteps((prev) => {
          const updated = prev.map((s) =>
            s.status === "pending" ? { ...s, status: "complete" as const } : s
          );
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
        return;
      }

      // For run.started - only add step if we don't have one yet (first event)
      // This prevents the "Updating" step from being added and then immediately completed
      if (eventType === "run.started") {
        setStreamingSteps((prev) => {
          // If we already have a pending step, just update its text
          if (prev.length > 0 && prev[prev.length - 1].status === "pending") {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, text }];
          }
          // Otherwise add a new step
          return [
            ...prev,
            {
              id: `${eventType}-${Date.now()}`,
              text,
              status: "pending" as const,
              timestamp: new Date(),
            },
          ];
        });
        return;
      }

      // Ignore network/agent level completion events - they cause the gap issue
      // These fire between run.started and the first part.created
      if (
        eventType === "run.completed" ||
        eventType === "network.completed" ||
        eventType === "agent.completed"
      ) {
        // Don't mark anything complete - just update text if needed
        return;
      }

      // For part.completed - just update text, don't mark complete
      if (eventType === "part.completed") {
        setStreamingSteps((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last.status === "pending") {
            return [...prev.slice(0, -1), { ...last, text }];
          }
          return prev;
        });
        return;
      }

      // For all other events - update current step text if different
      if (text !== prevText) {
        setStreamingSteps((prev) => {
          if (prev.length === 0) {
            return [
              {
                id: `${eventType}-${Date.now()}`,
                text,
                status: "pending" as const,
                timestamp: new Date(),
              },
            ];
          }
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
        imageIds: msg.imageIds as string[] | undefined,
        modelId: msg.modelId,
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
      // Track agent response completion
      if (typeof window !== "undefined" && window.pendo?.trackAgent) {
        window.pendo.trackAgent("agent_response", {
          agentId: "wYiI5wkyld0XBfcxyNqOovEQ0Rg",
          conversationId: screenId || "",
          messageId: lastMessage._id,
          content: stripFilesSummary(lastMessage.content),
          modelUsed: currentModelIdRef.current || "",
        });
      }

      // Response received! Clear loading state
      setIsWaitingForResponse(false);
      setStreamingSteps([]);
      setStatusText("");
    }

    lastConvexMessageCountRef.current = currentCount;
  }, [convexMessages, isWaitingForResponse, screenId]);

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
    async (content: string, options?: SendMessageOptions) => {
      const trimmedContent = content.trim();
      const { modelId, images = [] } = options || {};

      if (!trimmedContent && images.length === 0) return;
      if (isLoading) return;

      if (!screenId || !projectId) {
        setError({
          message: "Please select a screen to chat with AI",
          canRetry: false,
        });
        return;
      }

      setError(null);
      lastMessageRef.current = trimmedContent;
      lastOptionsRef.current = options;
      pendingUserMessageRef.current = trimmedContent;
      setStatusText(images.length > 0 ? "Uploading images..." : "Starting...");
      // Create initial step immediately so UI shows activity right away
      setStreamingSteps([
        {
          id: `initial-${Date.now()}`,
          text: images.length > 0 ? "Uploading images..." : "Starting...",
          status: "pending" as const,
          timestamp: new Date(),
        },
      ]);
      setIsWaitingForResponse(true); // Start waiting for response
      lastConvexMessageCountRef.current = convexMessages?.length || 0;

      try {
        // Upload images to Convex storage and convert to base64 for API
        const imageStorageIds: Id<"_storage">[] = [];
        const imageBase64Urls: string[] = [];

        for (const image of images) {
          // Upload to Convex storage
          const uploadUrl = await generateUploadUrl({});
          const uploadResult = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": image.file.type },
            body: image.file,
          });
          const { storageId } = await uploadResult.json();
          imageStorageIds.push(storageId as Id<"_storage">);

          // Convert to base64 for API
          const base64 = await fileToBase64(image.file);
          imageBase64Urls.push(base64);
        }

        if (imageBase64Urls.length > 0) {
          pendo.track("image_uploaded", {
            image_count: images.length,
            file_types: images.map((img) => img.file.type).join(","),
            total_size_bytes: images.reduce((sum, img) => sum + img.file.size, 0),
            model_id: modelId || "default",
          });
        }

        setStatusText("Starting...");

        // Save user message to Convex with image IDs and model
        await createMessage({
          screenId: screenId as Id<"screens">,
          role: "user",
          content:
            trimmedContent || (images.length > 0 ? "[Image attached]" : ""),
          modelId,
          imageIds: imageStorageIds.length > 0 ? imageStorageIds : undefined,
        });

        // Update count after user message is saved
        lastConvexMessageCountRef.current = (convexMessages?.length || 0) + 1;

        // Update refs before sending so state() picks up the values
        currentModelIdRef.current = modelId;
        currentImageUrlsRef.current = imageBase64Urls;

        // Send message via the useAgents hook with model and images in state
        // The state function will be called by useAgents to get current state
        await agentSendMessage(trimmedContent || "[Image attached]");

        pendo.track("ai_prompt_submitted", {
          model_id: modelId || "default",
          prompt_length: trimmedContent.length,
          has_images: images.length > 0,
          image_count: images.length,
          has_extension_data: trimmedContent.includes("[UNITSET_ELEMENT_CAPTURE]"),
          screen_id: screenId,
          project_id: projectId,
          is_first_message: !convexMessages || convexMessages.length === 0,
        });

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
      generateUploadUrl,
      agentSendMessage,
      convexMessages?.length,
    ]
  );

  // Retry last message
  const retryLastMessage = useCallback(() => {
    if (!error?.canRetry || !error.originalMessage) return;
    if (typeof window !== "undefined" && window.pendo?.trackAgent) {
      window.pendo.trackAgent("user_reaction", {
        agentId: "wYiI5wkyld0XBfcxyNqOovEQ0Rg",
        conversationId: screenId || "",
        messageId: `retry_${Date.now()}`,
        content: "retry",
      });
    }
    sendMessage(error.originalMessage, lastOptionsRef.current);
  }, [error, sendMessage, screenId]);

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
