"use client";

import { Undo2, Redo2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "../ui/separator";

interface HistoryPillProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function HistoryPill({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: HistoryPillProps) {
  // Detect platform for keyboard shortcuts
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const undoShortcut = isMac ? "⌘Z" : "Ctrl+Z";
  const redoShortcut = isMac ? "⌘⇧Z" : "Ctrl+Shift+Z";

  return (
    <div className="pointer-events-auto fixed bottom-4 right-3 z-50">
      <div
        className="flex items-center gap-2 px-1.5 rounded-lg bg-card/90 p-1 backdrop-blur-2xl saturate-150"
        style={{
          boxShadow: "0 4px 16px -4px oklch(0 0 0 / 0.4)",
        }}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo"
                aria-disabled={!canUndo}
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-accent enabled:hover:text-accent-foreground"
              >
                <Undo2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Undo ({undoShortcut})</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo"
                aria-disabled={!canRedo}
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-accent enabled:hover:text-accent-foreground"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Redo ({redoShortcut})</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
