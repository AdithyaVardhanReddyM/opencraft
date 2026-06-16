"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Brain, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { cn } from "@/lib/utils";
import type { MessageReasoning } from "@/hooks/use-chat-streaming";

export interface ReasoningPanelProps {
  reasoning: MessageReasoning;
  className?: string;
}

/**
 * ReasoningPanel renders the model's live "thinking" stream.
 * While streaming it auto-expands so the user sees activity during the gap
 * before any answer text. Once complete it collapses to a "Thought for Ns"
 * chip that can be re-expanded on click.
 */
function ReasoningPanelComponent({ reasoning, className }: ReasoningPanelProps) {
  const isStreaming = reasoning.status === "streaming";

  // Expansion is derived: it follows the thinking state (expanded while
  // streaming, collapsed when done) until the user takes control, after which
  // their explicit choice wins. Deriving avoids a setState-in-effect.
  const [userExpanded, setUserExpanded] = useState<boolean | null>(null);
  const isExpanded = userExpanded !== null ? userExpanded : isStreaming;

  // Measure how long reasoning took. State is only updated from the interval
  // callback (never synchronously in the effect body) and freezes at the last
  // measured value once streaming stops.
  const startRef = useRef<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isStreaming) return;
    if (startRef.current === null) startRef.current = Date.now();
    const id = setInterval(() => {
      if (startRef.current !== null) {
        setElapsedMs(Date.now() - startRef.current);
      }
    }, 200);
    return () => clearInterval(id);
  }, [isStreaming]);

  // Keep the streaming reasoning scrolled to the latest tokens.
  const bodyRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isExpanded && isStreaming && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [reasoning.content, isExpanded, isStreaming]);

  const seconds = !isStreaming ? Math.max(1, Math.round(elapsedMs / 1000)) : null;
  const headerLabel = isStreaming
    ? "Thinking…"
    : seconds !== null
      ? `Thought for ${seconds}s`
      : "Thought process";

  const handleToggle = () => {
    setUserExpanded(!isExpanded);
  };

  return (
    <div className={cn("mb-1.5 flex flex-col gap-1", className)}>
      <button
        onClick={handleToggle}
        className="group flex items-center gap-1.5 self-start text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
      >
        <Brain className="h-3.5 w-3.5 shrink-0" />
        {isStreaming ? (
          <Shimmer className="text-xs" duration={1.5} spread={3}>
            {headerLabel}
          </Shimmer>
        ) : (
          <span>{headerLabel}</span>
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && reasoning.content && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              ref={bodyRef}
              className="max-h-40 overflow-y-auto whitespace-pre-wrap border-l-2 border-border/40 pl-2.5 text-xs leading-relaxed text-muted-foreground/70"
            >
              {reasoning.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const ReasoningPanel = memo(ReasoningPanelComponent);
