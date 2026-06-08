"use client";

import { Square, RectangleHorizontal } from "lucide-react";
import type { CornerType } from "@/lib/canvas/properties-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CornerTypeControlProps {
  value: CornerType | "mixed";
  onChange: (value: CornerType) => void;
}

export function CornerTypeControl({ value, onChange }: CornerTypeControlProps) {
  return (
    <div className="flex items-center gap-0.5 bg-background/50 rounded-md p-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onChange("sharp")}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              value === "sharp"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            aria-label="Sharp corners"
            aria-pressed={value === "sharp"}
          >
            <Square className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Sharp corners
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onChange("rounded")}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              value === "rounded"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            aria-label="Rounded corners"
            aria-pressed={value === "rounded"}
          >
            <RoundedSquareIcon className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Rounded corners
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// Custom rounded square icon
function RoundedSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
    </svg>
  );
}
