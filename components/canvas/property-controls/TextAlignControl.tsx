"use client";

import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import type { TextAlignOption } from "@/lib/canvas/properties-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TextAlignControlProps {
  value: TextAlignOption | "mixed";
  onChange: (value: TextAlignOption) => void;
}

const ALIGN_OPTIONS: {
  id: TextAlignOption;
  label: string;
  icon: typeof AlignLeft;
}[] = [
  { id: "left", label: "Align left", icon: AlignLeft },
  { id: "center", label: "Align center", icon: AlignCenter },
  { id: "right", label: "Align right", icon: AlignRight },
];

export function TextAlignControl({ value, onChange }: TextAlignControlProps) {
  return (
    <div className="flex items-center gap-0.5 bg-background/50 rounded-md p-0.5">
      {ALIGN_OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
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
                <Icon className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>
              {option.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
