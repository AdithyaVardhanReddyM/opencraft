"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Palette,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Circle,
  Square,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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

interface AppearanceSectionProps {
  computedStyles: ComputedStylesInfo;
  pendingChanges: StyleChanges | null;
  onStyleChange: (property: string, value: string) => void;
}

type BackgroundType = "solid" | "gradient" | "image";
type BorderStyle = "solid" | "dashed" | "dotted" | "none";

interface ShadowConfig {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  visible: boolean;
  inset: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function parseNumeric(value: string): number {
  const match = value.match(/^(-?\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function rgbToHex(rgb: string): string {
  if (rgb.startsWith("#")) return rgb;
  if (rgb === "transparent" || rgb === "rgba(0, 0, 0, 0)") return "transparent";
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "#000000";
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function parseOpacityFromRgba(rgba: string): number {
  const match = rgba.match(/rgba?\([^)]+,\s*([\d.]+)\)/);
  return match ? parseFloat(match[1]) * 100 : 100;
}

function hexToRgba(hex: string, opacity: number): string {
  if (hex === "transparent") return "transparent";
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

function parseShadow(shadowStr: string): ShadowConfig[] {
  if (!shadowStr || shadowStr === "none") return [];
  const shadows: ShadowConfig[] = [];
  const parts = shadowStr.split(/,(?![^(]*\))/);
  for (const part of parts) {
    const trimmed = part.trim();
    const inset = trimmed.includes("inset");
    const values = trimmed.replace("inset", "").trim();
    const match = values.match(
      /(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(\d+)px\s+(.*)/
    );
    if (match) {
      shadows.push({
        x: parseInt(match[1]),
        y: parseInt(match[2]),
        blur: parseInt(match[3]),
        spread: parseInt(match[4]),
        color: rgbToHex(match[5]),
        opacity: parseOpacityFromRgba(match[5]),
        visible: true,
        inset,
      });
    }
  }
  return shadows;
}

function shadowToString(shadows: ShadowConfig[]): string {
  if (shadows.length === 0) return "none";
  return shadows
    .filter((s) => s.visible)
    .map((s) => {
      const color = hexToRgba(s.color, s.opacity);
      const inset = s.inset ? "inset " : "";
      return `${inset}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${color}`;
    })
    .join(", ");
}

// ============================================================================
// Color Input Component
// ============================================================================

function ColorInput({
  value,
  onChange,
  opacity = 100,
  onOpacityChange,
}: {
  value: string;
  onChange: (value: string) => void;
  opacity?: number;
  onOpacityChange?: (opacity: number) => void;
}) {
  const hexValue = rgbToHex(value);
  const isTransparent = hexValue === "transparent";

  return (
    <div className="flex items-center gap-2">
      {/* Color swatch */}
      <div className="relative shrink-0">
        <input
          type="color"
          value={isTransparent ? "#000000" : hexValue}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="w-9 h-9 rounded-lg border border-border/60 cursor-pointer"
          style={{ backgroundColor: isTransparent ? "transparent" : hexValue }}
        />
      </div>
      {/* Hex input */}
      <Input
        value={hexValue}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-xs flex-1 font-mono min-w-0 bg-muted/30 border-border/40"
        placeholder="#000000"
      />
      {/* Opacity input */}
      {onOpacityChange && (
        <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 w-20 shrink-0 overflow-hidden">
          <Input
            type="number"
            value={Math.round(opacity)}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value) || 0)}
            className="h-full border-0 bg-transparent pl-2 pr-0 text-xs rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-0"
            min={0}
            max={100}
          />
          <span className="text-xs text-muted-foreground px-2 shrink-0">%</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Shadow Control Component
// ============================================================================

function ShadowControl({
  shadow,
  onChange,
  onRemove,
  label,
}: {
  shadow: ShadowConfig;
  onChange: (shadow: ShadowConfig) => void;
  onRemove: () => void;
  label: string;
}) {
  return (
    <div className="space-y-2 p-3 bg-muted/20 rounded-lg border border-border/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    onChange({ ...shadow, visible: !shadow.visible })
                  }
                >
                  {shadow.visible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle visibility</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onRemove}
                >
                  <Minus className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { key: "x", label: "X", value: shadow.x },
          { key: "y", label: "Y", value: shadow.y },
          { key: "blur", label: "□", value: shadow.blur, min: 0 },
          { key: "spread", label: "○", value: shadow.spread },
        ].map(({ key, label, value, min }) => (
          <div
            key={key}
            className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden"
          >
            <span className="px-2 text-xs text-muted-foreground border-r border-border/40 h-full flex items-center">
              {label}
            </span>
            <Input
              type="number"
              value={value}
              onChange={(e) =>
                onChange({ ...shadow, [key]: parseInt(e.target.value) || 0 })
              }
              className="h-full border-0 bg-transparent px-1 text-xs rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
              min={min}
            />
          </div>
        ))}
      </div>

      <ColorInput
        value={shadow.color}
        onChange={(color) => onChange({ ...shadow, color })}
        opacity={shadow.opacity}
        onOpacityChange={(opacity) => onChange({ ...shadow, opacity })}
      />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AppearanceSection({
  computedStyles,
  pendingChanges,
  onStyleChange,
}: AppearanceSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [bgType, setBgType] = useState<BackgroundType>("solid");
  const [showPerCornerRadius, setShowPerCornerRadius] = useState(false);

  const getValue = (property: keyof ComputedStylesInfo): string => {
    if (pendingChanges && property in pendingChanges) {
      return pendingChanges[property];
    }
    return computedStyles[property] || "";
  };

  // Parse shadows
  const boxShadowStr = getValue("boxShadow");
  const allShadows = parseShadow(boxShadowStr);
  const dropShadows = allShadows.filter((s) => !s.inset);
  const innerShadows = allShadows.filter((s) => s.inset);

  const updateShadows = (
    newDropShadows: ShadowConfig[],
    newInnerShadows: ShadowConfig[]
  ) => {
    const all = [
      ...newDropShadows.map((s) => ({ ...s, inset: false })),
      ...newInnerShadows.map((s) => ({ ...s, inset: true })),
    ];
    onStyleChange("boxShadow", shadowToString(all));
  };

  const addDropShadow = () => {
    const newShadow: ShadowConfig = {
      x: 0,
      y: 2,
      blur: 3,
      spread: 0,
      color: "#000000",
      opacity: 20,
      visible: true,
      inset: false,
    };
    updateShadows([...dropShadows, newShadow], innerShadows);
  };

  const borderStyle = (getValue("borderStyle") || "solid") as BorderStyle;
  const outlineStyle = (getValue("outlineStyle") || "none") as BorderStyle;

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
        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
        Appearance
      </button>

      {isOpen && (
        <div className="px-3 pb-4 space-y-5">
          {/* Background */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Background
              </Label>
              <div className="flex p-1 bg-muted/30 rounded-lg border border-border/40">
                {(["solid", "gradient", "image"] as BackgroundType[]).map(
                  (type) => (
                    <Button
                      key={type}
                      variant="ghost"
                      size="sm"
                      onClick={() => setBgType(type)}
                      className={cn(
                        "h-7 px-2.5 text-xs rounded-md",
                        bgType === type && "bg-background shadow-sm"
                      )}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  )
                )}
              </div>
            </div>
            <ColorInput
              value={getValue("backgroundColor")}
              onChange={(v) => onStyleChange("backgroundColor", v)}
              opacity={parseOpacityFromRgba(getValue("backgroundColor"))}
              onOpacityChange={(opacity) => {
                const hex = rgbToHex(getValue("backgroundColor"));
                onStyleChange("backgroundColor", hexToRgba(hex, opacity));
              }}
            />
          </div>

          {/* Border */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Border</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs gap-1"
                  >
                    {borderStyle.charAt(0).toUpperCase() + borderStyle.slice(1)}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(["solid", "dashed", "dotted", "none"] as BorderStyle[]).map(
                    (style) => (
                      <DropdownMenuItem
                        key={style}
                        onClick={() => onStyleChange("borderStyle", style)}
                      >
                        <span
                          className={cn(borderStyle === style && "font-medium")}
                        >
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </span>
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ColorInput
              value={getValue("borderColor")}
              onChange={(v) => onStyleChange("borderColor", v)}
            />
            <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden">
              <span className="px-2.5 text-xs text-muted-foreground border-r border-border/40 h-full flex items-center">
                <Square className="h-3.5 w-3.5" />
              </span>
              <Input
                type="number"
                value={parseNumeric(getValue("borderWidth"))}
                onChange={(e) =>
                  onStyleChange("borderWidth", `${e.target.value}px`)
                }
                className="h-full border-0 bg-transparent px-2 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="0"
                min={0}
              />
            </div>
          </div>

          {/* Outline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Outline</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs gap-1"
                  >
                    {outlineStyle.charAt(0).toUpperCase() +
                      outlineStyle.slice(1)}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(["solid", "dashed", "dotted", "none"] as BorderStyle[]).map(
                    (style) => (
                      <DropdownMenuItem
                        key={style}
                        onClick={() => onStyleChange("outlineStyle", style)}
                      >
                        <span
                          className={cn(
                            outlineStyle === style && "font-medium"
                          )}
                        >
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </span>
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ColorInput
              value={getValue("outlineColor")}
              onChange={(v) => onStyleChange("outlineColor", v)}
              opacity={parseOpacityFromRgba(getValue("outlineColor"))}
              onOpacityChange={(opacity) => {
                const hex = rgbToHex(getValue("outlineColor"));
                onStyleChange("outlineColor", hexToRgba(hex, opacity));
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden">
                <span className="px-2 text-xs text-muted-foreground border-r border-border/40 h-full flex items-center">
                  <Square className="h-3 w-3" />
                </span>
                <Input
                  type="number"
                  value={parseNumeric(getValue("outlineWidth"))}
                  onChange={(e) =>
                    onStyleChange("outlineWidth", `${e.target.value}px`)
                  }
                  className="h-full border-0 bg-transparent px-2 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="0"
                  min={0}
                />
              </div>
              <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden">
                <span className="px-2 text-xs text-muted-foreground border-r border-border/40 h-full flex items-center">
                  <Circle className="h-3 w-3" />
                </span>
                <Input
                  type="number"
                  value={parseNumeric(getValue("outlineOffset"))}
                  onChange={(e) =>
                    onStyleChange("outlineOffset", `${e.target.value}px`)
                  }
                  className="h-full border-0 bg-transparent px-2 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Radius */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Radius</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        setShowPerCornerRadius(!showPerCornerRadius)
                      }
                    >
                      <Circle
                        className={cn(
                          "h-3.5 w-3.5",
                          showPerCornerRadius && "text-primary"
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Per-corner radius</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {!showPerCornerRadius ? (
              <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden">
                <Input
                  type="number"
                  value={parseNumeric(getValue("borderRadius"))}
                  onChange={(e) =>
                    onStyleChange("borderRadius", `${e.target.value}px`)
                  }
                  className="h-full border-0 bg-transparent px-3 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="0"
                  min={0}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "borderTopLeftRadius", label: "TL" },
                  { key: "borderTopRightRadius", label: "TR" },
                  { key: "borderBottomLeftRadius", label: "BL" },
                  { key: "borderBottomRightRadius", label: "BR" },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden"
                  >
                    <span className="px-2 text-xs text-muted-foreground border-r border-border/40 h-full flex items-center">
                      {label}
                    </span>
                    <Input
                      type="number"
                      value={parseNumeric(
                        getValue(key as keyof ComputedStylesInfo)
                      )}
                      onChange={(e) =>
                        onStyleChange(key, `${e.target.value}px`)
                      }
                      className="h-full border-0 bg-transparent px-2 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="0"
                      min={0}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drop Shadow */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Drop shadow
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={addDropShadow}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add shadow</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {dropShadows.map((shadow, idx) => (
              <ShadowControl
                key={idx}
                shadow={shadow}
                label={`Shadow ${idx + 1}`}
                onChange={(newShadow) => {
                  const newDropShadows = [...dropShadows];
                  newDropShadows[idx] = newShadow;
                  updateShadows(newDropShadows, innerShadows);
                }}
                onRemove={() => {
                  const newDropShadows = dropShadows.filter(
                    (_, i) => i !== idx
                  );
                  updateShadows(newDropShadows, innerShadows);
                }}
              />
            ))}
          </div>

          {/* Inner Shadow */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Inner shadow
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        const newShadow: ShadowConfig = {
                          x: 0,
                          y: 2,
                          blur: 4,
                          spread: 0,
                          color: "#000000",
                          opacity: 15,
                          visible: true,
                          inset: true,
                        };
                        updateShadows(dropShadows, [
                          ...innerShadows,
                          newShadow,
                        ]);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add inner shadow</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {innerShadows.map((shadow, idx) => (
              <ShadowControl
                key={idx}
                shadow={shadow}
                label={`Inner ${idx + 1}`}
                onChange={(newShadow) => {
                  const newInnerShadows = [...innerShadows];
                  newInnerShadows[idx] = newShadow;
                  updateShadows(dropShadows, newInnerShadows);
                }}
                onRemove={() => {
                  const newInnerShadows = innerShadows.filter(
                    (_, i) => i !== idx
                  );
                  updateShadows(dropShadows, newInnerShadows);
                }}
              />
            ))}
          </div>

          {/* Element Opacity */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">
              Element opacity
            </Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[parseFloat(getValue("opacity")) * 100 || 100]}
                onValueChange={([value]) =>
                  onStyleChange("opacity", String(value / 100))
                }
                max={100}
                step={1}
                className="flex-1"
              />
              <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 w-20 shrink-0 overflow-hidden">
                <Input
                  type="number"
                  value={Math.round(
                    parseFloat(getValue("opacity")) * 100 || 100
                  )}
                  onChange={(e) =>
                    onStyleChange(
                      "opacity",
                      String((parseFloat(e.target.value) || 100) / 100)
                    )
                  }
                  className="h-full border-0 bg-transparent pl-2 pr-0 text-xs rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-0"
                  min={0}
                  max={100}
                />
                <span className="text-xs text-muted-foreground px-2 shrink-0">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
