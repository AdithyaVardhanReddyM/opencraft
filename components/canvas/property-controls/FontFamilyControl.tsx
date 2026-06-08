"use client";

import type { FontFamilyPreset } from "@/lib/canvas/properties-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FontFamilyControlProps {
  value: FontFamilyPreset | "mixed";
  onChange: (value: FontFamilyPreset) => void;
}

const FONT_OPTIONS: { id: FontFamilyPreset; label: string }[] = [
  { id: "sans", label: "Sans-serif" },
  { id: "playful", label: "Playful" },
  { id: "mono", label: "Monospace" },
];

export function FontFamilyControl({ value, onChange }: FontFamilyControlProps) {
  return (
    <div className="flex items-center gap-0.5 bg-background/50 rounded-md p-0.5">
      {FONT_OPTIONS.map((option) => (
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
              <FontIcon type={option.id} />
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

// Custom font icons
function FontIcon({ type }: { type: FontFamilyPreset }) {
  if (type === "sans") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
      >
        <text
          x="0"
          y="17"
          fontSize="20"
          fontFamily="Arial, sans-serif"
          fill="currentColor"
          stroke="none"
        >
          Aa
        </text>
      </svg>
    );
  }

  if (type === "playful") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
        <text
          x="0"
          y="17"
          fontSize="18"
          fontFamily="Comic Sans MS, cursive"
          fill="currentColor"
          stroke="none"
          fontStyle="italic"
        >
          Aa
        </text>
      </svg>
    );
  }

  // mono
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
      <text
        x="1"
        y="17"
        fontSize="12"
        fontFamily="monospace"
        fill="currentColor"
        stroke="none"
      >
        {"</>"}
      </text>
    </svg>
  );
}
