"use client";

import { useState, useCallback } from "react";
import { Palette, Check, Loader2, ChevronDown } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { THEMES, type ThemeDefinition } from "@/lib/canvas/theme-utils";

function ThemeColorSwatches({ colors }: { colors: [string, string, string] }) {
  return (
    <div className="flex gap-0.5">
      {colors.map((color, index) => (
        <Avatar key={index} className="size-3.5">
          <AvatarFallback style={{ backgroundColor: color }} />
        </Avatar>
      ))}
    </div>
  );
}

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => Promise<void>;
  disabled?: boolean;
}

export function ThemeSelector({
  currentTheme,
  onThemeChange,
  disabled = false,
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyingThemeId, setApplyingThemeId] = useState<string | null>(null);

  const currentThemeData =
    THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  const handleThemeSelect = useCallback(
    async (theme: ThemeDefinition) => {
      if (theme.id === currentTheme || isApplying) return;

      setIsApplying(true);
      setApplyingThemeId(theme.id);

      try {
        await onThemeChange(theme.id);
        setIsOpen(false);
      } catch (error) {
        console.error("Failed to apply theme:", error);
      } finally {
        setIsApplying(false);
        setApplyingThemeId(null);
      }
    },
    [currentTheme, isApplying, onThemeChange]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1 h-8 px-2 rounded-md transition-colors",
                disabled
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              disabled={disabled}
              aria-label="Change theme"
            >
              {isApplying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Palette className="w-4 h-4" />
              )}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {disabled ? "Sandbox not ready" : "Change theme"}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="w-48 p-1 max-h-80 overflow-y-auto"
        align="start"
        sideOffset={8}
      >
        {THEMES.map((theme) => {
          const isActive = currentTheme === theme.id;
          const isThisApplying = applyingThemeId === theme.id;
          return (
            <button
              key={theme.id}
              className={cn(
                "flex items-center gap-2 w-full px-2.5 py-2 rounded-md text-left transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
                isApplying && !isThisApplying && "opacity-50"
              )}
              onClick={() => handleThemeSelect(theme)}
              disabled={isApplying}
            >
              <ThemeColorSwatches colors={theme.colors} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{theme.name}</div>
              </div>
              {isThisApplying ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : isActive ? (
                <Check className="w-4 h-4 shrink-0 text-primary" />
              ) : null}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
