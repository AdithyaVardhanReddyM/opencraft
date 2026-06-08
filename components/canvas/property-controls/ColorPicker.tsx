"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { COLOR_PALETTE } from "@/lib/canvas/properties-utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ColorPickerProps {
  value: string | "mixed";
  onChange: (value: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setOpen(false);
  };

  const displayColor = value === "mixed" ? "#888888" : value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              className="flex h-7 w-7 items-center justify-center rounded bg-background/50 transition-colors hover:bg-accent"
              aria-label="Color picker"
            >
              <div
                className="h-4 w-4 rounded-sm border border-border/50"
                style={{ backgroundColor: displayColor }}
              />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Color
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="w-auto p-2 bg-card border-border"
        side="bottom"
        align="start"
        sideOffset={8}
      >
        <div className="grid grid-cols-5 gap-1.5">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              className="relative h-6 w-6 rounded-sm border border-border/30 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-card"
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            >
              {value === color && (
                <Check
                  className="absolute inset-0 m-auto h-3.5 w-3.5"
                  style={{
                    color: isLightColor(color) ? "#000000" : "#ffffff",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper to determine if a color is light (for contrast)
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
