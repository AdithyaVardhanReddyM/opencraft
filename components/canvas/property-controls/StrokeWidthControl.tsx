"use client";

import type { StrokeWidthPreset } from "@/lib/canvas/properties-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StrokeWidthControlProps {
  value: StrokeWidthPreset | "mixed";
  onChange: (value: StrokeWidthPreset) => void;
}

const WIDTH_OPTIONS: {
  id: StrokeWidthPreset;
  label: string;
  height: number;
}[] = [
  { id: "thin", label: "Thin (1px)", height: 1 },
  { id: "normal", label: "Normal (2px)", height: 2 },
  { id: "thick", label: "Thick (4px)", height: 4 },
];

export function StrokeWidthControl({
  value,
  onChange,
}: StrokeWidthControlProps) {
  return (
    <div className="flex items-center gap-0.5 bg-background/50 rounded-md p-0.5">
      {WIDTH_OPTIONS.map((option) => (
        <Tooltip key={option.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onChange(option.id)}
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                value === option.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
              aria-label={option.label}
              aria-pressed={value === option.id}
            >
              <div
                className="w-3.5 rounded-full"
                style={{
                  height: option.height,
                  backgroundColor: "currentColor",
                }}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            {option.label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
