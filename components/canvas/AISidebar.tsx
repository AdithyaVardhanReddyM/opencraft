"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Code2,
  Pencil,
  PanelLeftClose,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface ErrorState {
  message: string;
  originalMessage: string;
  canRetry: boolean;
}

// Toggle button component
export function AISidebarToggle({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const isHoveringRef = useRef(false);

  return (
    <Tooltip
      delayDuration={300}
      open={tooltipOpen}
      onOpenChange={(open) => {
        if (open && !isHoveringRef.current) return;
        setTooltipOpen(open);
      }}
    >
      <TooltipTrigger asChild>
        <button
          onClick={onToggle}
          onMouseEnter={() => {
            isHoveringRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveringRef.current = false;
            setTooltipOpen(false);
          }}
          aria-label={isOpen ? "Close AI panel" : "Open AI panel"}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
            isOpen
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
              : "bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-primary/20"
          )}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4} className="text-xs">
        {isOpen ? "Close AI panel" : "Open AI panel"}
      </TooltipContent>
    </Tooltip>
  );
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen && inputRef.current && activeTab === "chat") {
      inputRef.current.focus();
    }
  }, [isOpen, activeTab]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const sendMessage = useCallback(
    async (messageContent?: string) => {
      const content = messageContent || input.trim();
      if (!content || isLoading) return;

      // Validate required fields
      if (!selectedScreenId || !projectId) {
        setError({
          message: "Please select a screen to chat with AI",
          originalMessage: content,
          canRetry: false,
        });
        return;
      }

      // Clear any previous error state
      setError(null);

      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: content,
        timestamp: new Date(),
      };

      // Only add user message if it's not a retry (retry uses existing message)
      if (!messageContent) {
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        if (inputRef.current) {
          inputRef.current.style.height = "auto";
        }
      }
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            threadId,
            screenId: selectedScreenId,
            projectId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.error || "Failed to send message";
          throw new Error(errorMessage);
        }
        setThreadId(data.threadId);

        await pollForResponse(data.eventId, content);
      } catch (err) {
        console.error("Chat error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";

        // Set error state for retry functionality
        setError({
          message: errorMessage,
          originalMessage: content,
          canRetry: true,
        });

        // Add error message to chat
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: "assistant",
            content: errorMessage,
            timestamp: new Date(),
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, threadId, selectedScreenId, projectId]
  );

  // Retry the last failed message
  const retryLastMessage = useCallback(() => {
    if (!error?.canRetry || !error.originalMessage) return;

    // Remove the last error message from the chat
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage?.isError) {
        return prev.slice(0, -1);
      }
      return prev;
    });

    // Retry sending the message
    sendMessage(error.originalMessage);
  }, [error, sendMessage]);

  // Clear messages when screen changes
  useEffect(() => {
    setMessages([]);
    setThreadId(null);
    setError(null);
  }, [selectedScreenId]);

  const pollForResponse = async (eventId: string, originalMessage: string) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: `I received your message: "${originalMessage}". The agent is processing this in the background. Check the Inngest dashboard for the full response.`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Header with tabs - Notch Style */}
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
            {/* Messages */}
            <ScrollArea className="flex-1 px-3 py-3" ref={scrollRef}>
              {messages.length === 0 ? (
                <EmptyChat hasScreen={!!selectedScreenId} />
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  {isLoading && <ThinkingIndicator />}
                  {error?.canRetry && !isLoading && (
                    <ErrorRetryButton onRetry={retryLastMessage} />
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <ChatInput
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onSend={sendMessage}
              isLoading={isLoading}
            />
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

// Empty chat state
function EmptyChat({ hasScreen }: { hasScreen: boolean }) {
  if (!hasScreen) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
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
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      <div className="relative mb-4">
        <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div className="absolute -inset-2 bg-primary/10 rounded-3xl blur-xl -z-10" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        Start a conversation
      </h3>
      <p className="text-xs text-muted-foreground text-center max-w-[200px] mb-6">
        Ask me to help design, generate UI, or answer questions about your
        project
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {["Design a hero section", "Create a button", "Add a form"].map(
          (suggestion) => (
            <button
              key={suggestion}
              className="px-3 py-1.5 text-xs rounded-full border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
            >
              {suggestion}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// Chat message component
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isError = message.isError;

  return (
    <div
      className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
            isError
              ? "bg-destructive/10 border-destructive/20"
              : "bg-linear-to-br from-primary/20 to-primary/5 border-primary/20"
          )}
        >
          {isError ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <Bot className="h-4 w-4 text-primary" />
          )}
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : isError
            ? "bg-destructive/10 border border-destructive/20 text-destructive rounded-bl-sm"
            : "bg-muted/60 border border-border/40 rounded-bl-sm"
        )}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary border border-border/40">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// Thinking indicator
function ThinkingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-muted/60 border border-border/40 px-3.5 py-2.5 rounded-bl-sm">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
        </div>
        <span className="text-xs text-muted-foreground">Thinking...</span>
      </div>
    </div>
  );
}

// Error retry button component
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

// Chat input component
const ChatInput = ({
  ref,
  value,
  onChange,
  onKeyDown,
  onSend,
  isLoading,
}: {
  ref: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  isLoading: boolean;
}) => {
  return (
    <div className="p-3 pt-0 bg-transparent">
      <div className="relative group">
        <div className="relative flex items-end gap-2 rounded-lg bg-muted/30 hover:bg-muted/50 p-1.5 transition-all focus-within:bg-muted/50 focus-within:ring-2 focus-within:ring-primary/10">
          <textarea
            ref={ref}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder="Ask AI..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50 min-h-[36px] max-h-[120px] py-2.5 px-3 rounded-lg"
          />
          <Button
            size="icon"
            onClick={onSend}
            disabled={!value.trim() || isLoading}
            className={cn(
              "h-8 w-8 shrink-0 rounded-full transition-all mb-0.5 mr-0.5",
              value.trim() && !isLoading
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                : "bg-muted/50 text-muted-foreground"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Coming soon placeholder
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
