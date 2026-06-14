"use client";

import { cn } from "@/lib/utils";
import { Sparkle } from "lucide-react";

interface CreditBarProps {
  generationsRemaining: number;
  generationsLimit: number;
  className?: string;
}

/**
 * Credit bar showing remaining generations.
 * Appears at the top of the input area with a gradient background.
 */
export function CreditBar({
  generationsRemaining,
  generationsLimit,
  className,
}: CreditBarProps) {
  const isLow = generationsRemaining <= 3;
  const isExhausted = generationsRemaining <= 0;

  return (
    <div
      className={cn(
        "flex items-center px-3 py-0.5",
        isExhausted
          ? "bg-linear-to-r from-destructive/20 via-destructive/15 to-destructive/10 border-b border-destructive/30"
          : isLow
          ? "bg-linear-to-r from-amber-500/20 via-amber-500/15 to-amber-500/10 border-b border-amber-500/30"
          : "bg-linear-to-r from-primary/15 via-primary/10 to-primary/5 border-b border-primary/20",
        className
      )}
    >
      <div className="flex items-center gap-2 text-[12px]">
        <Sparkle fill="#f08000" className={cn("h-3 w-3 text-primary")} />
        <span
          className={cn(
            "font-medium",
            isExhausted
              ? "text-destructive"
              : isLow
              ? "text-amber-500"
              : "text-primary"
          )}
        >
          {generationsRemaining} / {generationsLimit} messages left
        </span>
        {isExhausted && (
          <span className="text-muted-foreground ml-1">• Limit reached</span>
        )}
      </div>
    </div>
  );
}
