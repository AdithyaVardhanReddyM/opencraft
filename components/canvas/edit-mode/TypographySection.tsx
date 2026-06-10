"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ComputedStylesInfo, StyleChanges } from "@/lib/edit-mode/types";

// ============================================================================
// Types
// ============================================================================

interface TypographySectionProps {
  computedStyles: ComputedStylesInfo;
  pendingChanges: StyleChanges | null;
  onStyleChange: (property: string, value: string) => void;
  textContent?: string;
}

// ============================================================================
// Constants
// ============================================================================

const FONT_FAMILIES = [
  { value: "system-ui", label: "System UI" },
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "ui-monospace, monospace", label: "Monospace" },
];

const FONT_WEIGHTS = [
  { value: "100", label: "Thin" },
  { value: "200", label: "Extra Light" },
  { value: "300", label: "Light" },
  { value: "400", label: "Normal" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra Bold" },
  { value: "900", label: "Black" },
];

// ============================================================================
// Helper Functions
// ============================================================================

function parseNumeric(value: string): number {
  const match = value.match(/^(-?\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseLineHeight(value: string, fontSize: string): number {
  const numValue = parseFloat(value);
  if (!isNaN(numValue) && !value.includes("px") && !value.includes("%")) {
    return Math.round(numValue * 100);
  }
  if (value.includes("px")) {
    const lineHeightPx = parseNumeric(value);
    const fontSizePx = parseNumeric(fontSize);
    if (fontSizePx > 0) {
      return Math.round((lineHeightPx / fontSizePx) * 100);
    }
  }
  return 125;
}

function parseLetterSpacing(value: string): number {
  if (value === "normal" || value === "0px") return 0;
  const numValue = parseNumeric(value);
  if (value.includes("em")) {
    return Math.round(numValue * 100);
  }
  return Math.round(numValue);
}

function rgbToHex(rgb: string): string {
  if (rgb.startsWith("#")) return rgb;
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "#000000";
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getFontFamilyLabel(value: string): string {
  const font = FONT_FAMILIES.find((f) => f.value === value);
  return font?.label || value.split(",")[0] || "System UI";
}

function getFontWeightLabel(value: string): string {
  const weight = FONT_WEIGHTS.find((w) => w.value === value);
  return weight?.label || "Normal";
}

// ============================================================================
// Main Component
// ============================================================================

export function TypographySection({
  computedStyles,
  pendingChanges,
  onStyleChange,
  textContent,
}: TypographySectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const getValue = (property: keyof ComputedStylesInfo): string => {
    if (pendingChanges && property in pendingChanges) {
      return pendingChanges[property];
    }
    return computedStyles[property] || "";
  };

  const fontWeight = getValue("fontWeight");
  const fontStyle = getValue("fontStyle");
  const textDecoration = getValue("textDecoration");
  const textAlign = getValue("textAlign");

  const isBold = parseInt(fontWeight) >= 700;
  const isItalic = fontStyle === "italic";
  const isStrikethrough = textDecoration.includes("line-through");

  const hexColor = rgbToHex(getValue("color"));

  return (
    <div className="border-b border-border/40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <Type className="h-3.5 w-3.5 text-muted-foreground" />
        Typography
      </button>

      {isOpen && (
        <div className="px-3 pb-4 space-y-4">
          {/* Text Preview */}
          {textContent && (
            <div className="p-3 bg-muted/20 rounded-lg border border-border/30 text-sm text-foreground/80 max-h-24 overflow-y-auto leading-relaxed">
              {textContent}
            </div>
          )}

          {/* Alignment and Style Buttons */}
          <div className="flex items-center gap-3">
            {/* Alignment */}
            <div className="flex p-1 bg-muted/30 rounded-lg border border-border/40">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStyleChange("textAlign", "left")}
                      className={cn(
                        "h-8 w-8 rounded-md",
                        textAlign === "left" && "bg-background shadow-sm"
                      )}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Align Left</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStyleChange("textAlign", "center")}
                      className={cn(
                        "h-8 w-8 rounded-md",
                        textAlign === "center" && "bg-background shadow-sm"
                      )}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Align Center</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStyleChange("textAlign", "right")}
                      className={cn(
                        "h-8 w-8 rounded-md",
                        textAlign === "right" && "bg-background shadow-sm"
                      )}
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Align Right</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Style Toggles */}
            <div className="flex p-1 bg-muted/30 rounded-lg border border-border/40">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        onStyleChange(
                          "textDecoration",
                          isStrikethrough ? "none" : "line-through"
                        )
                      }
                      className={cn(
                        "h-8 w-8 rounded-md",
                        isStrikethrough && "bg-background shadow-sm"
                      )}
                    >
                      <Strikethrough className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Strikethrough</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        onStyleChange("fontWeight", isBold ? "400" : "700")
                      }
                      className={cn(
                        "h-8 w-8 rounded-md",
                        isBold && "bg-background shadow-sm"
                      )}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bold</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        onStyleChange(
                          "fontStyle",
                          isItalic ? "normal" : "italic"
                        )
                      }
                      className={cn(
                        "h-8 w-8 rounded-md",
                        isItalic && "bg-background shadow-sm"
                      )}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Italic</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Font Family</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-9 justify-between text-sm bg-muted/30 border-border/40"
                >
                  {getFontFamilyLabel(getValue("fontFamily"))}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-full min-w-[200px]"
              >
                {FONT_FAMILIES.map((font) => (
                  <DropdownMenuItem
                    key={font.value}
                    onClick={() => onStyleChange("fontFamily", font.value)}
                  >
                    <span
                      className={cn(
                        getValue("fontFamily") === font.value && "font-medium"
                      )}
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Font Weight Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-fit h-9 justify-between text-sm bg-muted/30 border-border/40 gap-2"
              >
                {getFontWeightLabel(fontWeight)}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[140px]">
              {FONT_WEIGHTS.map((weight) => (
                <DropdownMenuItem
                  key={weight.value}
                  onClick={() => onStyleChange("fontWeight", weight.value)}
                >
                  <span
                    className={cn(fontWeight === weight.value && "font-medium")}
                  >
                    {weight.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Font Size, Line Height, Letter Spacing */}
          <div className="grid grid-cols-3 gap-2">
            {/* Font Size */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden">
                    <span className="px-2 text-xs text-muted-foreground border-r border-border/40 h-full flex items-center font-medium shrink-0">
                      ↕A
                    </span>
                    <Input
                      type="number"
                      value={parseNumeric(getValue("fontSize"))}
                      onChange={(e) =>
                        onStyleChange("fontSize", `${e.target.value}px`)
                      }
                      className="h-full border-0 bg-transparent px-2 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-0"
                      placeholder="16"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Font Size (px)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Line Height */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden">
                    <span className="px-2 text-xs text-muted-foreground border-r border-border/40 h-full flex items-center font-medium underline underline-offset-2 shrink-0">
                      A
                    </span>
                    <Input
                      type="number"
                      value={parseLineHeight(
                        getValue("lineHeight"),
                        getValue("fontSize")
                      )}
                      onChange={(e) => {
                        const percent = parseFloat(e.target.value) || 100;
                        onStyleChange("lineHeight", String(percent / 100));
                      }}
                      className="h-full border-0 bg-transparent px-1 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-0"
                      placeholder="125"
                    />
                    <span className="text-xs text-muted-foreground px-2 shrink-0">
                      %
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Line Height (%)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Letter Spacing */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden">
                    <span className="px-2 text-xs text-muted-foreground border-r border-border/40 h-full flex items-center font-medium shrink-0">
                      |A|
                    </span>
                    <Input
                      type="number"
                      value={parseLetterSpacing(getValue("letterSpacing"))}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onStyleChange("letterSpacing", `${val / 100}em`);
                      }}
                      className="h-full border-0 bg-transparent px-1 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-0"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground px-2 shrink-0">
                      %
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Letter Spacing (%)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Color</Label>
            <div className="flex items-center gap-2">
              {/* Color swatch */}
              <div className="relative shrink-0">
                <input
                  type="color"
                  value={hexColor}
                  onChange={(e) => onStyleChange("color", e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="w-9 h-9 rounded-lg border border-border/60 cursor-pointer"
                  style={{ backgroundColor: hexColor }}
                />
              </div>
              {/* Hex input */}
              <Input
                value={hexColor}
                onChange={(e) => onStyleChange("color", e.target.value)}
                className="h-9 text-xs flex-1 font-mono bg-muted/30 border-border/40"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
