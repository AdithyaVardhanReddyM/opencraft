"use client";

import { Minus, Plus, Maximize2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";

interface ZoomBarProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onZoomToFit: () => void;
  minScale?: number;
  maxScale?: number;
}

export function ZoomBar({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  onZoomToFit,
  minScale = 0.1,
  maxScale = 8.0,
}: ZoomBarProps) {
  const percentage = Math.round(scale * 100);
  const isAtMin = scale <= minScale;
  const isAtMax = scale >= maxScale;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="pointer-events-auto fixed bottom-4 right-27 z-50">
        <div
          className="flex items-center gap-0.5 rounded-lg bg-card/90 p-1 backdrop-blur-2xl saturate-150"
          style={{
            boxShadow: "0 4px 16px -4px oklch(0 0 0 / 0.4)",
          }}
        >
          <button
            onClick={onZoomOut}
            disabled={isAtMin}
            aria-label="Zoom out"
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-accent enabled:hover:text-accent-foreground"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onReset}
                aria-label="Reset zoom to 100%"
                className="w-16 rounded-md px-2 py-1 text-center text-xs font-medium text-foreground transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 hover:bg-accent hover:text-accent-foreground"
              >
                {percentage}%
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              Reset zoom
            </TooltipContent>
          </Tooltip>

          <button
            onClick={onZoomIn}
            disabled={isAtMax}
            aria-label="Zoom in"
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-accent enabled:hover:text-accent-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1 h-6 w-px bg-border/70" aria-hidden />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onZoomToFit}
                aria-label="Zoom to fit"
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 enabled:hover:bg-accent enabled:hover:text-accent-foreground"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              Fit content
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
