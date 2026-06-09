"use client";

import { useState, useCallback } from "react";
import {
  MessageSquare,
  Code2,
  Pencil,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
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
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { StreamingIndicator } from "@/components/canvas/StreamingIndicator";
import { useChatStreaming, type ChatMessage } from "@/hooks/use-chat-streaming";

type ChatInputStatus = "submitted" | "streaming" | "ready" | "error";

const SUGGESTIONS = [
  "Create a landing page",
  "Build a dashboard",
  "Design a login form",
  "Add a navigation bar",
];

export function AISidebar({
  isOpen,
  onClose,
  selectedScreenId,
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedScreenId?: string;
  projectId?: string;
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
    (message: PromptInputMessage) => {
      if (!message.text.trim()) return;
      sendMessage(message.text);
    },
    [sendMessage]
  );

  // Map streaming status to chat input status
  const chatStatus: ChatInputStatus = status;

  if (!isOpen) return null;

  return (
    <div
      className="pointer-events-auto fixed left-3 z-40 flex flex-col animate-in slide-in-from-left-2 duration-200"
      style={{
        top: "60px",
        bottom: "12px",
        width: "340px",
      }}
    >
      <div className="flex flex-col h-full rounded-xl bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
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
            <ChatInput onSubmit={handleSubmit} status={chatStatus} />
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent
            value="edit"
            className="flex-1 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden"
          >
            <ComingSoonPlaceholder
              icon={Pencil}
              title="Edit Mode"
              description="Select and edit elements on your canvas with AI assistance. Coming soon!"
            />
          </TabsContent>

          {/* Code Tab */}
          <TabsContent
            value="code"
            className="flex-1 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden"
          >
            <ComingSoonPlaceholder
              icon={Code2}
              title="Code Generation"
              description="Generate production-ready code from your designs. Coming soon!"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // User message - right-aligned glassy bubble with primary tint
  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="group relative max-w-[85%]">
          <div className="relative rounded-[14px] rounded-br-[2px] px-3.5 py-2.5 text-sm leading-relaxed bg-primary/10 text-primary shadow-sm">
            <div className="absolute inset-0 rounded-[14px] rounded-br-[2px] bg-linear-to-br from-white/5 to-transparent pointer-events-none" />
            <span className="relative">{message.content}</span>
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
            "flex-1 text-sm leading-relaxed",
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

function ChatInput({
  onSubmit,
  status,
}: {
  onSubmit: (message: PromptInputMessage) => void;
  status: ChatInputStatus;
}) {
  const [inputValue, setInputValue] = useState("");

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

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      onSubmit(message);
      setInputValue("");
    },
    [onSubmit]
  );

  return (
    <div className="p-3 pt-2">
      <PromptInput
        onSubmit={handleSubmit}
        className={cn(
          "rounded-xl bg-muted/30 border border-border/40 transition-colors hover:bg-muted/40",
          "focus-within:bg-muted/50 focus-within:border-border/60",
          "focus-within:ring-[3px] focus-within:ring-primary/70 focus-within:ring-offset-0 focus-within:shadow-[0_0_24px_rgba(249,115,22,0.35)]"
        )}
      >
        <PromptInputBody>
          <PromptInputTextarea
            placeholder="Ask AI anything..."
            className="min-h-[36px] max-h-[120px] text-sm placeholder:text-muted-foreground/50 bg-transparent border-none shadow-none focus-visible:ring-0"
            value={inputValue}
            onChange={handleInputChange}
          />
        </PromptInputBody>
        <PromptInputFooter className="justify-end px-2 pb-2">
          <PromptInputSubmit
            status={status}
            size="icon-sm"
            className="h-8 w-8 rounded-lg"
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function ComingSoonPlaceholder({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-4">
        <div className="h-14 w-14 rounded-xl bg-muted/50 flex items-center justify-center border border-border/40">
          <Icon className="h-7 w-7 text-muted-foreground/60" />
        </div>
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[220px]">
        {description}
      </p>
      <div className="mt-4 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
        <span className="text-xs font-medium text-primary">Coming Soon</span>
      </div>
    </div>
  );
}
