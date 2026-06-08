"use client";

import { Minus, MoreHorizontal } from "lucide-react";
import type { StrokeType } from "@/lib/canvas/properties-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StrokeTypeControlProps {
  value: StrokeType | "mixed";
  onChange: (value: StrokeType) => void;
}

export function StrokeTypeControl({ value, onChange }: StrokeTypeControlProps) {
  return (
    <div className="flex items-center gap-0.5 bg-background/50 rounded-md p-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onChange("solid")}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              value === "solid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            aria-label="Solid stroke"
            aria-pressed={value === "solid"}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Solid
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onChange("dashed")}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              value === "dashed"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            aria-label="Dashed stroke"
            aria-pressed={value === "dashed"}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Dashed
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
