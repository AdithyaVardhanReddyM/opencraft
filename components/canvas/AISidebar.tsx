"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  ImageIcon,
  X,
  CheckIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import Image from "next/image";
import {
  PromptInput,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StreamingIndicator } from "@/components/canvas/StreamingIndicator";
import { useChatStreaming, type ChatMessage } from "@/hooks/use-chat-streaming";
import { CodeExplorer } from "@/components/canvas/code-explorer";
import { EditModeProvider } from "@/contexts/EditModeContext";
import { EditModePanel } from "@/components/canvas/EditModePanel";
import { ExtensionChip } from "@/components/canvas/ExtensionChip";
import {
  isExtensionContentFormat,
  parseExtensionContent,
  formatForAI,
  extractExtensionDataFromMessage,
  getDisplayContentFromMessage,
  type CapturedElement,
  type ExtensionMetadataDisplay,
} from "@/lib/extension-content";
import {
  AI_MODELS,
  DEFAULT_MODEL_ID,
  getModelById,
  getProviders,
  modelSupportsVision,
} from "@/lib/ai-models";
import { CreditBar } from "@/components/canvas/CreditBar";
import { nanoid } from "nanoid";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type ChatInputStatus = "submitted" | "streaming" | "ready" | "error";

/** Display-only chip for showing extension content in messages */
function ExtensionChipDisplay({
  metadata,
}: {
  metadata: ExtensionMetadataDisplay;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-primary/20 border border-primary/30 text-xs">
      <svg
        className="w-3.5 h-3.5 text-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      <span className="font-medium text-primary-foreground">
        {metadata.tagName} • {metadata.width}×{metadata.height}px
      </span>
    </div>
  );
}

const SUGGESTIONS = [
  "Create a landing page",
  "Build a dashboard",
  "Design a login form",
  "Add a navigation bar",
];

// Sidebar widths
const COLLAPSED_WIDTH = 340;
const EXPANDED_WIDTH_VW = 50; // 50% of viewport width

export function AISidebar({
  isOpen,
  selectedScreenId,
  projectId,
  sandboxId,
  sandboxUrl,
  cachedFiles,
  initialImage,
  initialPrompt,
  initialModelId,
  onInitialDataConsumed,
}: {
  isOpen: boolean;
  onClose?: () => void;
  selectedScreenId?: string;
  projectId?: string;
  sandboxId?: string;
  sandboxUrl?: string;
  cachedFiles?: Record<string, string>;
  initialImage?: Blob;
  initialPrompt?: string;
  initialModelId?: string;
  onInitialDataConsumed?: () => void;
}) {
  const [activeTab, setActiveTab] = useState("chat");

  // Use the streaming hook for chat functionality
  const {
    messages,
    isLoading,
    isLoadingHistory,
    status,
    statusText,
    streamingSteps,
    error,
    sendMessage,
    retryLastMessage,
  } = useChatStreaming({
    screenId: selectedScreenId,
    projectId,
  });

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleSubmit = useCallback(
    (
      message: PromptInputMessage,
      options: {
        modelId: string;
        images: ImageAttachment[];
        extensionData?: CapturedElement;
      }
    ) => {
      const { modelId, images, extensionData } = options;
      if (!message.text.trim() && !extensionData && images.length === 0) return;

      // If extension data is present, format it for AI
      let finalMessage = message.text.trim();
      if (extensionData) {
        const formattedExtension = formatForAI(extensionData);
        finalMessage = finalMessage
          ? `${finalMessage}\n\n${formattedExtension}`
          : `Replicate this element:\n\n${formattedExtension}`;
      }

      // Pass modelId and images to sendMessage
      sendMessage(finalMessage, { modelId, images });
    },
    [sendMessage]
  );

  // Map streaming status to chat input status
  const chatStatus: ChatInputStatus = status;

  // Determine if sidebar should be expanded (Code tab is active)
  const isExpanded = activeTab === "code";

  // Calculate width based on expansion state
  const sidebarWidth = isExpanded
    ? `${EXPANDED_WIDTH_VW}vw`
    : `${COLLAPSED_WIDTH}px`;

  if (!isOpen) return null;

  return (
    <motion.div
      className="pointer-events-auto fixed left-3 z-60 flex flex-col"
      style={{
        top: "60px",
        bottom: "12px",
      }}
      initial={{ width: COLLAPSED_WIDTH, x: -10, opacity: 0 }}
      animate={{
        width: sidebarWidth,
        x: 0,
        opacity: 1,
      }}
      transition={{
        width: { type: "spring", stiffness: 300, damping: 30 },
        x: { duration: 0.2 },
        opacity: { duration: 0.2 },
      }}
    >
      <div className="flex flex-col h-full rounded-xl bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden scrollbar-thin">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Header with tabs */}
          <div className="relative flex items-center justify-center pt-3 pb-1 px-3 z-10">
            <TabsList className="relative h-10 bg-muted/30 backdrop-blur-2xl saturate-150 border border-border/20 shadow-sm rounded-full p-1 gap-1 grid grid-cols-3">
              {["chat", "edit", "code"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="relative z-10 rounded-full px-4 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 data-[state=active]:text-foreground data-[state=active]:bg-transparent"
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="active-tab"
                      className="absolute inset-0 bg-background/60 dark:bg-white/8 backdrop-blur-sm rounded-full -z-10 shadow-xs ring-1 ring-white/10 dark:ring-white/10"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Chat Tab */}
          <TabsContent
            value="chat"
            className="flex-1 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden"
          >
            {isLoadingHistory ? (
              <LoadingHistory />
            ) : messages.length === 0 && !isLoading ? (
              <EmptyChat
                hasScreen={!!selectedScreenId}
                onSuggestionClick={handleSuggestionClick}
              />
            ) : (
              <Conversation className="flex-1">
                <ConversationContent className="gap-4 px-3 py-3">
                  {messages.map((msg) => (
                    <ChatMessageItem key={msg.id} message={msg} />
                  ))}
                  {/* Show streaming indicator with step history when processing */}
                  <StreamingIndicator
                    statusText={statusText || "Processing..."}
                    steps={streamingSteps}
                    isVisible={isLoading}
                  />
                  {error?.canRetry && !isLoading && (
                    <ErrorRetryButton onRetry={retryLastMessage} />
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
            )}

            {/* Input */}
            <ChatInput
              onSubmit={handleSubmit}
              status={chatStatus}
              initialImage={initialImage}
              initialPrompt={initialPrompt}
              initialModelId={initialModelId}
              onInitialDataConsumed={onInitialDataConsumed}
            />
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent
            value="edit"
            className="flex-1 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden"
          >
            <EditModeProvider
              sandboxId={sandboxId}
              screenId={selectedScreenId}
              sandboxUrl={sandboxUrl}
              isActive={activeTab === "edit"}
            >
              <EditModePanel
                screenId={selectedScreenId}
                sandboxId={sandboxId}
              />
            </EditModeProvider>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent
            value="code"
            className="flex-1 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden"
          >
            <CodeExplorer
              screenId={selectedScreenId}
              sandboxId={sandboxId}
              cachedFiles={cachedFiles}
              isExpanded={isExpanded}
            />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}

function LoadingHistory() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 px-4">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/unitset_logo.svg"
          alt="AI"
          width={32}
          height={32}
          className="h-8 w-8"
        />
        <Shimmer className="text-sm" duration={1.5} spread={3}>
          Loading conversation
        </Shimmer>
      </div>
    </div>
  );
}

function EmptyChat({
  hasScreen,
  onSuggestionClick,
}: {
  hasScreen: boolean;
  onSuggestionClick: (suggestion: string) => void;
}) {
  if (!hasScreen) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-12 px-4">
        <div className="relative mb-4">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/40">
            <MessageSquare className="h-8 w-8 text-muted-foreground/60" />
          </div>
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">
          Select a screen
        </h3>
        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
          Select a screen on the canvas to start chatting with AI about it
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-8 px-4">
      <Image
        src="/chat_initial_card.svg"
        alt="Start a conversation"
        width={400}
        height={150}
        className="mb-6"
      />

      {/* Suggestions */}
      <div className="w-full space-y-2">
        <p className="text-xs text-muted-foreground/70 text-center mb-3">
          Try one of these
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="px-3 py-1.5 text-xs rounded-full bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/50 transition-all duration-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatMessageTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChatMessageItem({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isError = message.isError;
  const isStreaming = message.isStreaming;

  // Fetch image URLs if message has images
  const imageUrls = useQuery(
    api.messages.getImageUrls,
    message.imageIds && message.imageIds.length > 0
      ? { storageIds: message.imageIds as Id<"_storage">[] }
      : "skip"
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if user message contains extension content
  const extensionData = isUser
    ? extractExtensionDataFromMessage(message.content)
    : null;
  const displayContent = isUser
    ? getDisplayContentFromMessage(message.content)
    : message.content;

  // User message - right-aligned glassy bubble with primary tint
  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="group relative max-w-[85%]">
          <div className="relative rounded-[14px] rounded-br-[2px] px-3.5 py-2.5 text-sm leading-relaxed bg-primary/10 text-primary shadow-sm">
            <div className="absolute inset-0 rounded-[14px] rounded-br-[2px] bg-linear-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative flex flex-col gap-2">
              {extensionData && (
                <ExtensionChipDisplay metadata={extensionData} />
              )}
              {/* Display attached images */}
              {imageUrls && Object.keys(imageUrls).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(imageUrls).map(([id, url]) =>
                    url ? <MessageImageThumbnail key={id} url={url} /> : null
                  )}
                </div>
              )}
              {displayContent && displayContent !== "[Image attached]" && (
                <span>{displayContent}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            title="Copy message"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    );
  }

  // Assistant message - left-aligned with credits and time
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2.5 items-start">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center mt-0.5">
          {isError ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <Image
              src="/unitset_logo.svg"
              alt="AI"
              width={20}
              height={20}
              className="h-5 w-5"
            />
          )}
        </div>
        <div
          className={cn(
            "flex-1 text-sm",
            isError ? "text-destructive" : "text-foreground"
          )}
        >
          <MessageResponse>{message.content}</MessageResponse>
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-0.5 bg-foreground/70 animate-pulse" />
          )}
        </div>
      </div>
      {/* Credits and time footer - only show when not streaming */}
      {!isError && !isStreaming && (
        <div className="flex items-center gap-2 ml-8.5 text-[10px] text-muted-foreground/60">
          <span className="flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" />5 credits
          </span>
          <span className="text-muted-foreground/30">•</span>
          <span>{formatMessageTime(message.timestamp)}</span>
        </div>
      )}
    </div>
  );
}

function ErrorRetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex justify-center">
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="gap-2 text-xs border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 text-destructive hover:text-destructive"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </Button>
    </div>
  );
}

/** Image attachment type for pending uploads */
interface ImageAttachment {
  id: string;
  file: File;
  previewUrl: string;
}

function ChatInput({
  onSubmit,
  status,
  initialImage,
  initialPrompt,
  initialModelId,
  onInitialDataConsumed,
}: {
  onSubmit: (
    message: PromptInputMessage,
    options: {
      modelId: string;
      images: ImageAttachment[];
      extensionData?: CapturedElement;
    }
  ) => void;
  status: ChatInputStatus;
  initialImage?: Blob;
  initialPrompt?: string;
  initialModelId?: string;
  onInitialDataConsumed?: () => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [extensionContent, setExtensionContent] =
    useState<CapturedElement | null>(null);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialDataProcessedRef = useRef(false);

  const selectedModelData = getModelById(selectedModel);
  const providers = getProviders();

  // Handle initial data from frame generation
  useEffect(() => {
    if (initialDataProcessedRef.current) return;
    if (!initialImage && !initialPrompt && !initialModelId) return;

    initialDataProcessedRef.current = true;

    // Set initial prompt
    if (initialPrompt) {
      setInputValue(initialPrompt);
    }

    // Set initial model
    if (initialModelId) {
      setSelectedModel(initialModelId);
    }

    // Convert blob to ImageAttachment
    if (initialImage) {
      const file = new File([initialImage], "frame-capture.png", {
        type: "image/png",
      });
      const attachment: ImageAttachment = {
        id: nanoid(),
        file,
        previewUrl: URL.createObjectURL(initialImage),
      };
      setPendingImages([attachment]);
    }

    // Notify parent that initial data has been consumed
    onInitialDataConsumed?.();
  }, [initialImage, initialPrompt, initialModelId, onInitialDataConsumed]);

  // Auto-capitalize first character
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let value = e.target.value;
      // Capitalize first character if it's a letter
      if (value.length === 1 && /[a-z]/.test(value)) {
        value = value.toUpperCase();
      }
      setInputValue(value);
    },
    []
  );

  // Handle paste to detect extension content or images
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedText = e.clipboardData.getData("text");

      // Check if it's extension content
      if (isExtensionContentFormat(pastedText)) {
        e.preventDefault();
        const parsed = parseExtensionContent(pastedText);
        if (parsed.isExtensionContent && parsed.data) {
          setExtensionContent(parsed.data);
        }
        return;
      }

      // Check for pasted images
      const items = e.clipboardData?.items;
      if (items) {
        const imageFiles: File[] = [];
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              imageFiles.push(file);
            }
          }
        }
        if (imageFiles.length > 0) {
          e.preventDefault();
          addImages(imageFiles);
        }
      }
    },
    []
  );

  // Add images to pending list
  const addImages = useCallback((files: File[]) => {
    const newAttachments: ImageAttachment[] = files.map((file) => ({
      id: nanoid(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingImages((prev) => [...prev, ...newAttachments]);
  }, []);

  // Remove image from pending list
  const removeImage = useCallback((id: string) => {
    setPendingImages((prev) => {
      const found = prev.find((img) => img.id === id);
      if (found) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        addImages(Array.from(files));
      }
      // Reset input to allow selecting same file again
      e.target.value = "";
    },
    [addImages]
  );

  // Open file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveExtensionContent = useCallback(() => {
    setExtensionContent(null);
  }, []);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      onSubmit(message, {
        modelId: selectedModel,
        images: pendingImages,
        extensionData: extensionContent || undefined,
      });
      setInputValue("");
      setExtensionContent(null);
      // Clear images and revoke URLs
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setPendingImages([]);
    },
    [onSubmit, extensionContent, selectedModel, pendingImages]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const imageFiles = Array.from(files).filter((f) =>
          f.type.startsWith("image/")
        );
        if (imageFiles.length > 0) {
          addImages(imageFiles);
        }
      }
    },
    [addImages]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Check if model supports vision when images are attached
  const showVisionWarning =
    pendingImages.length > 0 && !modelSupportsVision(selectedModel);

  return (
    <div className="p-3 pt-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Credit bar and input container */}
      <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/30 hover:bg-muted/40 transition-colors focus-within:bg-muted/50 focus-within:border-border/60 focus-within:ring-[3px] focus-within:ring-primary/70 focus-within:ring-offset-0 focus-within:shadow-[0_0_24px_rgba(249,115,22,0.35)]">
        {/* Credit Bar */}
        <CreditBar credits={30} selectedModelId={selectedModel} />

        <PromptInput
          onSubmit={handleSubmit}
          className="border-0 ring-0 shadow-none focus-within:ring-0 bg-transparent"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <PromptInputBody>
            {/* Extension Chip */}
            {extensionContent && (
              <div className="px-3 pt-3">
                <ExtensionChip
                  content={extensionContent}
                  onRemove={handleRemoveExtensionContent}
                />
              </div>
            )}

            {/* Image Attachments */}
            {pendingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 px-3 pt-3">
                {pendingImages.map((img) => (
                  <ImageAttachmentChip
                    key={img.id}
                    attachment={img}
                    onRemove={() => removeImage(img.id)}
                  />
                ))}
              </div>
            )}

            {/* Vision warning */}
            {showVisionWarning && (
              <div className="px-3 pt-2">
                <p className="text-xs text-amber-500">
                  ⚠️ {selectedModelData?.name} may not process images
                </p>
              </div>
            )}

            <PromptInputTextarea
              placeholder={
                extensionContent
                  ? "Add instructions for replication..."
                  : pendingImages.length > 0
                  ? "Describe what you want to do with these images..."
                  : "Ask AI anything..."
              }
              className="min-h-[36px] max-h-[120px] text-sm placeholder:text-muted-foreground/50 bg-transparent border-none shadow-none focus-visible:ring-0"
              value={inputValue}
              onChange={handleInputChange}
              onPaste={handlePaste}
            />
          </PromptInputBody>
          <PromptInputFooter className="justify-between px-2 pb-2">
            <PromptInputTools>
              {/* Add Image Button - hide for xAI Grok (free tier doesn't support vision) */}
              {selectedModel !== DEFAULT_MODEL_ID && (
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <DropdownMenuItem onSelect={openFilePicker}>
                      <ImageIcon className="mr-2 size-4" />
                      Add photos
                    </DropdownMenuItem>
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              )}

              {/* Model Selector */}
              <ModelSelector
                open={modelSelectorOpen}
                onOpenChange={setModelSelectorOpen}
              >
                <ModelSelectorTrigger asChild>
                  <PromptInputButton>
                    {selectedModelData?.providerSlug && (
                      <ModelSelectorLogo
                        provider={selectedModelData.providerSlug}
                      />
                    )}
                    <ModelSelectorName className="max-w-[80px] text-xs">
                      {selectedModelData?.name || "Select model"}
                    </ModelSelectorName>
                  </PromptInputButton>
                </ModelSelectorTrigger>
                <ModelSelectorContent>
                  <ModelSelectorInput
                    placeholder="Search models..."
                    className="focus-visible:ring-0"
                  />
                  <ModelSelectorList>
                    <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                    {providers.map((provider) => (
                      <ModelSelectorGroup heading={provider} key={provider}>
                        {AI_MODELS.filter((m) => m.provider === provider).map(
                          (model) => (
                            <ModelSelectorItem
                              key={model.id}
                              value={model.id}
                              onSelect={() => {
                                setSelectedModel(model.id);
                                setModelSelectorOpen(false);
                              }}
                            >
                              <ModelSelectorLogo
                                provider={model.providerSlug}
                              />
                              <ModelSelectorName>
                                {model.name}
                              </ModelSelectorName>
                              {selectedModel === model.id ? (
                                <CheckIcon className="ml-auto size-4" />
                              ) : (
                                <div className="ml-auto size-4" />
                              )}
                            </ModelSelectorItem>
                          )
                        )}
                      </ModelSelectorGroup>
                    ))}
                  </ModelSelectorList>
                </ModelSelectorContent>
              </ModelSelector>
            </PromptInputTools>

            <PromptInputSubmit
              status={status}
              size="icon-sm"
              className="h-8 w-8 rounded-lg"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

/** Image attachment chip with preview and remove button */
function ImageAttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: ImageAttachment;
  onRemove: () => void;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      <div
        className="group relative flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-md border border-border px-1.5 font-medium text-sm transition-all hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
        onClick={() => setIsPreviewOpen(true)}
      >
        <div className="relative size-5 shrink-0">
          <div className="absolute inset-0 flex size-5 items-center justify-center overflow-hidden rounded bg-background transition-opacity group-hover:opacity-0">
            <img
              alt={attachment.file.name}
              className="size-5 object-cover"
              src={attachment.previewUrl}
            />
          </div>
          <Button
            aria-label="Remove image"
            className="absolute inset-0 size-5 cursor-pointer rounded p-0 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 [&>svg]:size-2.5"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            type="button"
            variant="ghost"
          >
            <X className="size-2.5" />
          </Button>
        </div>
        <span className="flex-1 truncate max-w-[100px] text-xs">
          {attachment.file.name}
        </span>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl p-2 bg-background/95 backdrop-blur-xl">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center overflow-hidden rounded-lg max-h-[70vh]">
              <img
                alt={attachment.file.name}
                className="max-h-[70vh] max-w-full object-contain"
                src={attachment.previewUrl}
              />
            </div>
            <p className="text-sm text-muted-foreground truncate max-w-full">
              {attachment.file.name}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Image thumbnail for displaying images in message history */
function MessageImageThumbnail({ url }: { url: string }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      <div
        className="relative size-12 cursor-pointer overflow-hidden rounded-md border border-border/50 hover:border-border transition-colors"
        onClick={() => setIsPreviewOpen(true)}
      >
        <img
          alt="Attached image"
          className="size-full object-cover"
          src={url}
        />
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl p-2 bg-background/95 backdrop-blur-xl">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <div className="flex items-center justify-center overflow-hidden rounded-lg max-h-[70vh]">
            <img
              alt="Attached image preview"
              className="max-h-[70vh] max-w-full object-contain"
              src={url}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
