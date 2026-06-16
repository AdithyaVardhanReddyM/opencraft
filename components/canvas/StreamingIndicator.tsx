"use client";

import { memo, useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { StreamingStep } from "@/hooks/use-chat-streaming";

export interface StreamingIndicatorProps {
  statusText: string;
  steps: StreamingStep[];
  isVisible: boolean;
  /** Concrete current action (e.g. "Writing app/page.tsx") shown under the active step. */
  activeDetail?: string;
  className?: string;
}

// Number of recent steps to always show
const VISIBLE_STEPS = 2;

// Seconds on the active step before showing the elapsed counter / reassurance.
const ELAPSED_VISIBLE_AFTER = 3;
const REASSURE_AFTER = 20;

/**
 * StreamingIndicator displays a compact, collapsible progress view
 * during agent processing with shimmer for pending steps.
 */
function StreamingIndicatorComponent({
  statusText,
  steps,
  isVisible,
  activeDetail,
  className,
}: StreamingIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Deduplicate consecutive steps with same text
  const deduplicatedSteps = useMemo(() => {
    if (steps.length === 0) return [];

    const result: StreamingStep[] = [];
    let lastText = "";

    for (const step of steps) {
      if (step.text !== lastText) {
        result.push(step);
        lastText = step.text;
      }
    }

    return result;
  }, [steps]);

  // Split steps into hidden (older) and visible (recent)
  const { hiddenSteps, visibleSteps } = useMemo(() => {
    if (deduplicatedSteps.length <= VISIBLE_STEPS) {
      return { hiddenSteps: [], visibleSteps: deduplicatedSteps };
    }

    const hidden = deduplicatedSteps.slice(0, -VISIBLE_STEPS);
    const visible = deduplicatedSteps.slice(-VISIBLE_STEPS);

    return { hiddenSteps: hidden, visibleSteps: visible };
  }, [deduplicatedSteps]);

  const hasHiddenSteps = hiddenSteps.length > 0;

  // Track time spent on the current (active) step so a long-running step never
  // looks frozen. Resets whenever a new step becomes active.
  const lastStep = deduplicatedSteps[deduplicatedSteps.length - 1];
  const isActivePending = !!lastStep && lastStep.status === "pending";

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isVisible || !isActivePending) return;
    // setNow is only called from the interval callback (not synchronously in
    // the effect body); elapsed is clamped to >= 0 so a brand-new step never
    // shows a stale/negative value before the first tick.
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isVisible, isActivePending, lastStep?.id]);

  const elapsedSec =
    isActivePending && lastStep
      ? Math.max(0, Math.floor((now - lastStep.timestamp.getTime()) / 1000))
      : 0;

  if (!isVisible) return null;

  // If no steps yet, show simple shimmer loading
  if (deduplicatedSteps.length === 0) {
    return (
      <div className={cn("flex gap-2.5 items-start", className)}>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center mt-0.5">
          <Image
            src="/opencraft_logo.svg"
            alt="AI"
            width={20}
            height={20}
            className="h-5 w-5"
          />
        </div>
        <div className="flex items-center py-1">
          <Shimmer className="text-sm" duration={1.5} spread={3}>
            {statusText || "Working"}
          </Shimmer>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2.5 items-start", className)}>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center mt-0.5">
        <Image
          src="/opencraft_logo.svg"
          alt="AI"
          width={20}
          height={20}
          className="h-5 w-5"
        />
      </div>
      <div className="flex flex-col gap-0.5 py-1 min-w-0 flex-1">
        {/* Expandable history button */}
        {hasHiddenSteps && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors mb-1 group"
          >
            <div className="flex items-center justify-center h-4 w-4 rounded bg-muted/30 group-hover:bg-muted/50 transition-colors">
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </div>
            <span>
              {isExpanded
                ? "Hide"
                : `${hiddenSteps.length} more step${
                    hiddenSteps.length > 1 ? "s" : ""
                  }`}
            </span>
          </button>
        )}

        {/* Hidden steps (expandable) */}
        <AnimatePresence>
          {isExpanded && hiddenSteps.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1 pb-1.5 mb-1.5 border-b border-border/20">
                {hiddenSteps.map((step) => (
                  <StepItem key={step.id} step={step} isCompact />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Always visible recent steps */}
        <div className="flex flex-col gap-1">
          {visibleSteps.map((step, index) => {
            const isLast = index === visibleSteps.length - 1;
            return (
              <StepItem
                key={step.id}
                step={step}
                isLast={isLast}
                elapsedSec={isLast ? elapsedSec : undefined}
              />
            );
          })}

          {/* Concrete current action (e.g. the file being written) */}
          {isActivePending && activeDetail && (
            <div className="ml-6 truncate font-mono text-[11px] text-muted-foreground/50">
              {activeDetail}
            </div>
          )}

          {/* Reassurance once a step has been running a while */}
          {isActivePending && elapsedSec >= REASSURE_AFTER && (
            <div className="ml-6 text-[11px] text-muted-foreground/40">
              Still working — this can take a moment
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StepItemProps {
  step: StreamingStep;
  isCompact?: boolean;
  isLast?: boolean;
  elapsedSec?: number;
}

function StepItem({ step, isCompact, isLast, elapsedSec }: StepItemProps) {
  const isPending = step.status === "pending";
  const showShimmer = isPending && isLast;
  const showElapsed =
    typeof elapsedSec === "number" && elapsedSec >= ELAPSED_VISIBLE_AFTER;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn("flex items-center gap-2", isCompact && "opacity-60")}
    >
      {/* Checkmark indicator for completed steps, spinner-like indicator for pending */}
      {isPending ? (
        isLast && (
          <div className="flex h-4 w-4 items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
        )
      ) : (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15">
          <Check className="h-2.5 w-2.5 text-emerald-500" />
        </div>
      )}

      {/* Step text - shimmer for current pending step */}
      {showShimmer ? (
        <Shimmer className="text-sm" duration={1.5} spread={3}>
          {step.text}
        </Shimmer>
      ) : (
        <span
          className={cn(
            "text-sm",
            isPending ? "text-muted-foreground" : "text-muted-foreground/50",
            isCompact && "text-xs"
          )}
        >
          {step.text}
        </span>
      )}

      {/* Elapsed time on the active step so it never looks frozen */}
      {showElapsed && (
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/40">
          {elapsedSec}s
        </span>
      )}
    </motion.div>
  );
}

export const StreamingIndicator = memo(StreamingIndicatorComponent);
