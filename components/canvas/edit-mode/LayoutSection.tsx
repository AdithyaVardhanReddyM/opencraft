"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Layout,
  ArrowRight,
  ArrowDown,
  MoveHorizontal,
  MoveVertical,
  Columns,
  Rows,
  WrapText,
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { ComputedStylesInfo, StyleChanges } from "@/lib/edit-mode/types";

// ============================================================================
// Types
// ============================================================================

interface LayoutSectionProps {
  computedStyles: ComputedStylesInfo;
  pendingChanges: StyleChanges | null;
  onStyleChange: (property: string, value: string) => void;
}

type LayoutMode = "flex" | "none";
type DimensionUnit = "px" | "%" | "auto" | "fit-content" | "100%";

// ============================================================================
// Helper Functions
// ============================================================================

function parseNumeric(value: string): number {
  const match = value.match(/^(-?\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseUnit(value: string): DimensionUnit {
  if (value === "auto" || value.includes("auto")) return "auto";
  if (value === "fit-content" || value.includes("fit-content"))
    return "fit-content";
  if (value === "100%") return "100%";
  if (value.includes("%")) return "%";
  return "px";
}

function formatValue(num: number, unit: DimensionUnit): string {
  if (unit === "auto") return "auto";
  if (unit === "fit-content") return "fit-content";
  if (unit === "100%") return "100%";
  return `${num}${unit}`;
}

// ============================================================================
// Dimension Input Component
// ============================================================================

function DimensionInput({
  label,
  value,
  onChange,
  tooltip,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  tooltip?: string;
}) {
  const numValue = parseNumeric(value);
  const unit = parseUnit(value);
  const isFixedUnit = unit === "px" || unit === "%";

  const handleNumChange = (newNum: string) => {
    const num = parseFloat(newNum) || 0;
    onChange(formatValue(num, unit));
  };

  const handleUnitChange = (newUnit: DimensionUnit) => {
    if (newUnit === "auto") {
      onChange("auto");
    } else if (newUnit === "fit-content") {
      onChange("fit-content");
    } else if (newUnit === "100%") {
      onChange("100%");
    } else {
      onChange(formatValue(numValue, newUnit));
    }
  };

  // Get display label for current unit
  const getUnitLabel = () => {
    if (unit === "fit-content") return "Fit";
    if (unit === "100%") return "Fill";
    if (unit === "auto") return "Auto";
    return unit;
  };

  const content = (
    <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden flex-1">
      {/* Unit dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 px-2 h-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-r border-border/40 shrink-0">
            <span className="font-medium">{label}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[120px]">
          <DropdownMenuItem onClick={() => handleUnitChange("px")}>
            <span className={cn(unit === "px" && "font-medium")}>
              Fixed (px)
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleUnitChange("%")}>
            <span className={cn(unit === "%" && "font-medium")}>
              Percent (%)
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleUnitChange("fit-content")}>
            <span className={cn(unit === "fit-content" && "font-medium")}>
              Fit content
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleUnitChange("100%")}>
            <span className={cn(unit === "100%" && "font-medium")}>
              Fill container
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleUnitChange("auto")}>
            <span className={cn(unit === "auto" && "font-medium")}>Auto</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Value input or label */}
      {isFixedUnit ? (
        <Input
          type="number"
          value={numValue}
          onChange={(e) => handleNumChange(e.target.value)}
          className="h-full border-0 bg-transparent px-2 text-sm text-right rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-0"
        />
      ) : (
        <span className="flex-1 px-2 text-sm text-muted-foreground text-right truncate">
          {getUnitLabel()}
        </span>
      )}
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

// ============================================================================
// Spacing Input Component
// ============================================================================

function SpacingInput({
  label,
  values,
  onChange,
}: {
  label: string;
  values: { top: string; right: string; bottom: string; left: string };
  onChange: (side: "top" | "right" | "bottom" | "left", value: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden">
                <span className="px-2 text-xs text-muted-foreground border-r border-border/40 h-full flex items-center">
                  <MoveVertical className="h-3 w-3" />
                </span>
                <Input
                  type="number"
                  value={parseNumeric(values.top)}
                  onChange={(e) => onChange("top", `${e.target.value}px`)}
                  className="h-full border-0 bg-transparent px-2 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="0"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Top</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden">
                <span className="px-2 text-xs text-muted-foreground border-r border-border/40 h-full flex items-center">
                  <MoveHorizontal className="h-3 w-3" />
                </span>
                <Input
                  type="number"
                  value={parseNumeric(values.right)}
                  onChange={(e) => onChange("right", `${e.target.value}px`)}
                  className="h-full border-0 bg-transparent px-2 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="0"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Right</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden">
                <span className="px-2 text-xs text-muted-foreground border-r border-border/40 h-full flex items-center">
                  <MoveVertical className="h-3 w-3 rotate-180" />
                </span>
                <Input
                  type="number"
                  value={parseNumeric(values.bottom)}
                  onChange={(e) => onChange("bottom", `${e.target.value}px`)}
                  className="h-full border-0 bg-transparent px-2 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="0"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Bottom</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden">
                <span className="px-2 text-xs text-muted-foreground border-r border-border/40 h-full flex items-center">
                  <MoveHorizontal className="h-3 w-3 rotate-180" />
                </span>
                <Input
                  type="number"
                  value={parseNumeric(values.left)}
                  onChange={(e) => onChange("left", `${e.target.value}px`)}
                  className="h-full border-0 bg-transparent px-2 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="0"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Left</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// ============================================================================
// Alignment Grid Component
// ============================================================================

function AlignmentGrid({
  justify,
  align,
  onJustifyChange,
  onAlignChange,
}: {
  justify: string;
  align: string;
  onJustifyChange: (value: string) => void;
  onAlignChange: (value: string) => void;
}) {
  const justifyMap: Record<string, number> = {
    "flex-start": 0,
    start: 0,
    center: 1,
    "flex-end": 2,
    end: 2,
  };
  const alignMap: Record<string, number> = {
    "flex-start": 0,
    start: 0,
    center: 1,
    "flex-end": 2,
    end: 2,
  };

  const justifyValues = ["flex-start", "center", "flex-end"];
  const alignValues = ["flex-start", "center", "flex-end"];

  const currentJ = justifyMap[justify] ?? 0;
  const currentA = alignMap[align] ?? 0;

  return (
    <div className="grid grid-cols-3 gap-1.5 p-2 bg-muted/30 rounded-lg border border-border/40">
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const isActive = currentJ === col && currentA === row;
          return (
            <button
              key={`${row}-${col}`}
              onClick={() => {
                onJustifyChange(justifyValues[col]);
                onAlignChange(alignValues[row]);
              }}
              className={cn(
                "w-5 h-5 rounded-full transition-colors",
                isActive
                  ? "bg-primary"
                  : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
              )}
            />
          );
        })
      )}
    </div>
  );
}

// ============================================================================
// Flex Controls Component
// ============================================================================

type GapMode = "fixed" | "auto";

function FlexControls({
  getValue,
  onStyleChange,
}: {
  getValue: (property: keyof ComputedStylesInfo) => string;
  onStyleChange: (property: string, value: string) => void;
}) {
  const columnGap = parseNumeric(
    getValue("columnGap") || getValue("gap") || "0"
  );
  const rowGap = parseNumeric(getValue("rowGap") || getValue("gap") || "0");

  const handleColumnGapChange = (value: string) => {
    const num = parseFloat(value) || 0;
    onStyleChange("columnGap", `${num}px`);
  };

  const handleRowGapChange = (value: string) => {
    const num = parseFloat(value) || 0;
    onStyleChange("rowGap", `${num}px`);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Flex</Label>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        {/* Left Column: Direction, Gaps */}
        <div className="flex flex-col justify-between gap-2">
          {/* Direction */}
          <div className="flex p-1 bg-muted/30 rounded-lg border border-border/40 h-9">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onStyleChange("flexDirection", "row")}
                    className={cn(
                      "h-full flex-1 rounded-md",
                      getValue("flexDirection") !== "column" &&
                        "bg-background shadow-sm"
                    )}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Row</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onStyleChange("flexDirection", "column")}
                    className={cn(
                      "h-full flex-1 rounded-md",
                      getValue("flexDirection") === "column" &&
                        "bg-background shadow-sm"
                    )}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Column</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Gap X */}
          <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden">
            <span className="px-2 text-muted-foreground border-r border-border/40 h-full flex items-center justify-center w-9 shrink-0">
              <Columns className="h-4 w-4" />
            </span>
            <Input
              type="number"
              value={columnGap}
              onChange={(e) => handleColumnGapChange(e.target.value)}
              className="h-full border-0 bg-transparent px-2 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-0"
              placeholder="0"
            />
          </div>

          {/* Gap Y */}
          <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 h-9 overflow-hidden">
            <span className="px-2 text-muted-foreground border-r border-border/40 h-full flex items-center justify-center w-9 shrink-0">
              <Rows className="h-4 w-4" />
            </span>
            <Input
              type="number"
              value={rowGap}
              onChange={(e) => handleRowGapChange(e.target.value)}
              className="h-full border-0 bg-transparent px-2 text-sm rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-0"
              placeholder="0"
            />
          </div>
        </div>

        {/* Right Column: Alignment, Wrap */}
        <div className="flex flex-col gap-2">
          {/* Alignment Grid */}
          <AlignmentGrid
            justify={getValue("justifyContent")}
            align={getValue("alignItems")}
            onJustifyChange={(v) => onStyleChange("justifyContent", v)}
            onAlignChange={(v) => onStyleChange("alignItems", v)}
          />

          {/* Wrap Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    onStyleChange(
                      "flexWrap",
                      getValue("flexWrap") === "wrap" ? "nowrap" : "wrap"
                    )
                  }
                  className={cn(
                    "h-9 w-full rounded-lg border border-border/40",
                    getValue("flexWrap") === "wrap"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <WrapText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Wrap Content</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LayoutSection({
  computedStyles,
  pendingChanges,
  onStyleChange,
}: LayoutSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Get current value (pending change or computed)
  const getValue = (property: keyof ComputedStylesInfo): string => {
    if (pendingChanges && property in pendingChanges) {
      return pendingChanges[property];
    }
    return computedStyles[property] || "";
  };

  // Determine layout mode
  const display = getValue("display");
  const isFlex = display === "flex" || display === "inline-flex";
  const mode: LayoutMode = isFlex ? "flex" : "none";

  const handleModeChange = (newMode: LayoutMode) => {
    if (newMode === "flex") {
      onStyleChange("display", "flex");
    } else {
      onStyleChange("display", "block");
    }
  };

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
        <Layout className="h-3.5 w-3.5 text-muted-foreground" />
        Layout
      </button>

      {isOpen && (
        <div className="px-3 pb-4 space-y-4">
          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-2">
            <DimensionInput
              label="W"
              value={getValue("width")}
              onChange={(v) => onStyleChange("width", v)}
              tooltip="Width"
            />
            <DimensionInput
              label="H"
              value={getValue("height")}
              onChange={(v) => onStyleChange("height", v)}
              tooltip="Height"
            />
          </div>

          {/* Mode Toggle */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Mode</Label>
            <div className="grid grid-cols-2 p-1 bg-muted/30 rounded-lg border border-border/40">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleModeChange("flex")}
                className={cn(
                  "h-8 text-sm font-medium rounded-md",
                  mode === "flex" && "bg-background shadow-sm"
                )}
              >
                Flex
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleModeChange("none")}
                className={cn(
                  "h-8 text-sm font-medium rounded-md",
                  mode === "none" && "bg-background shadow-sm"
                )}
              >
                None
              </Button>
            </div>
          </div>

          {/* Flex Controls */}
          {mode === "flex" && (
            <FlexControls getValue={getValue} onStyleChange={onStyleChange} />
          )}

          {/* Non-Flex Controls (Margin & Padding) */}
          {mode === "none" && (
            <>
              <SpacingInput
                label="Margin"
                values={{
                  top: getValue("marginTop"),
                  right: getValue("marginRight"),
                  bottom: getValue("marginBottom"),
                  left: getValue("marginLeft"),
                }}
                onChange={(side, value) => {
                  const propMap = {
                    top: "marginTop",
                    right: "marginRight",
                    bottom: "marginBottom",
                    left: "marginLeft",
                  };
                  onStyleChange(propMap[side], value);
                }}
              />
              <SpacingInput
                label="Padding"
                values={{
                  top: getValue("paddingTop"),
                  right: getValue("paddingRight"),
                  bottom: getValue("paddingBottom"),
                  left: getValue("paddingLeft"),
                }}
                onChange={(side, value) => {
                  const propMap = {
                    top: "paddingTop",
                    right: "paddingRight",
                    bottom: "paddingBottom",
                    left: "paddingLeft",
                  };
                  onStyleChange(propMap[side], value);
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
