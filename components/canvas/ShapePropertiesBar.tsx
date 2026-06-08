"use client";

import type { Tool, Shape, RectShape, TextShape } from "@/types/canvas";
import {
  type ShapeDefaultProperties,
  type StrokeType,
  type StrokeWidthPreset,
  type CornerType,
  type ControlType,
  type FontFamilyPreset,
  type TextAlignOption,
  getControlsForTool,
  getControlsForShapes,
  pixelsToStrokeWidth,
  radiusToCornerType,
  cssFontFamilyToPreset,
} from "@/lib/canvas/properties-utils";
import {
  StrokeTypeControl,
  StrokeWidthControl,
  ColorPicker,
  CornerTypeControl,
  FontFamilyControl,
  TextAlignControl,
} from "./property-controls";

interface ShapePropertiesBarProps {
  currentTool: Tool;
  selectedShapes: Shape[];
  defaultProperties: ShapeDefaultProperties;
  onPropertyChange: (property: string, value: unknown) => void;
  onDefaultChange: (property: string, value: unknown) => void;
}

export function ShapePropertiesBar({
  currentTool,
  selectedShapes,
  defaultProperties,
  onPropertyChange,
  onDefaultChange,
}: ShapePropertiesBarProps) {
  // Determine which controls to show
  const hasSelection = selectedShapes.length > 0;
  const controls = hasSelection
    ? getControlsForShapes(selectedShapes)
    : getControlsForTool(currentTool);

  // If no controls to show, render nothing
  if (controls.length === 0) {
    return null;
  }

  // Get current values from selection or defaults
  const strokeTypeValue = hasSelection
    ? getStrokeTypeFromShapes(selectedShapes)
    : defaultProperties.strokeType;

  const strokeWidthValue = hasSelection
    ? getStrokeWidthFromShapes(selectedShapes)
    : defaultProperties.strokeWidth;

  const colorValue = hasSelection
    ? getColorFromShapes(selectedShapes)
    : defaultProperties.strokeColor;

  const cornerTypeValue = hasSelection
    ? getCornerTypeFromShapes(selectedShapes)
    : defaultProperties.cornerType;

  const fontFamilyValue = hasSelection
    ? getFontFamilyFromShapes(selectedShapes)
    : "sans";

  const textAlignValue = hasSelection
    ? getTextAlignFromShapes(selectedShapes)
    : "left";

  const textColorValue = hasSelection
    ? getTextColorFromShapes(selectedShapes)
    : "#ffffff";

  // Handlers
  const handleStrokeTypeChange = (value: StrokeType) => {
    if (hasSelection) {
      onPropertyChange("strokeType", value);
    } else {
      onDefaultChange("strokeType", value);
    }
  };

  const handleStrokeWidthChange = (value: StrokeWidthPreset) => {
    if (hasSelection) {
      onPropertyChange("strokeWidth", value);
    } else {
      onDefaultChange("strokeWidth", value);
    }
  };

  const handleColorChange = (value: string) => {
    if (hasSelection) {
      onPropertyChange("strokeColor", value);
    } else {
      onDefaultChange("strokeColor", value);
    }
  };

  const handleCornerTypeChange = (value: CornerType) => {
    if (hasSelection) {
      onPropertyChange("cornerType", value);
    } else {
      onDefaultChange("cornerType", value);
    }
  };

  const handleFontFamilyChange = (value: FontFamilyPreset) => {
    if (hasSelection) {
      onPropertyChange("fontFamily", value);
    }
  };

  const handleTextAlignChange = (value: TextAlignOption) => {
    if (hasSelection) {
      onPropertyChange("textAlign", value);
    }
  };

  const handleTextColorChange = (value: string) => {
    if (hasSelection) {
      onPropertyChange("textColor", value);
    }
  };

  return (
    <div
      className="flex items-center gap-1.5 px-1 py-1 bg-card/90 backdrop-blur-2xl saturate-150 border border-border rounded-lg"
      style={{
        boxShadow: "0 4px 16px -4px oklch(0 0 0 / 0.4)",
      }}
    >
      {controls.includes("strokeType") && (
        <StrokeTypeControl
          value={strokeTypeValue}
          onChange={handleStrokeTypeChange}
        />
      )}

      {controls.includes("strokeWidth") && (
        <>
          <Separator />
          <StrokeWidthControl
            value={strokeWidthValue}
            onChange={handleStrokeWidthChange}
          />
        </>
      )}

      {controls.includes("color") && (
        <>
          <Separator />
          <ColorPicker value={colorValue} onChange={handleColorChange} />
        </>
      )}

      {controls.includes("cornerType") && (
        <>
          <Separator />
          <CornerTypeControl
            value={cornerTypeValue}
            onChange={handleCornerTypeChange}
          />
        </>
      )}

      {controls.includes("fontFamily") && (
        <FontFamilyControl
          value={fontFamilyValue}
          onChange={handleFontFamilyChange}
        />
      )}

      {controls.includes("textAlign") && (
        <>
          <Separator />
          <TextAlignControl
            value={textAlignValue}
            onChange={handleTextAlignChange}
          />
        </>
      )}

      {controls.includes("textColor") && (
        <>
          <Separator />
          <ColorPicker
            value={textColorValue}
            onChange={handleTextColorChange}
          />
        </>
      )}
    </div>
  );
}

// Separator component
function Separator() {
  return <div className="w-px h-5 bg-border/50" />;
}

// Helper functions to extract values from selected shapes
function getStrokeTypeFromShapes(shapes: Shape[]): StrokeType | "mixed" {
  const types = shapes
    .filter((s): s is Shape & { strokeType?: StrokeType } =>
      ["rect", "ellipse", "line", "arrow", "freedraw"].includes(s.type)
    )
    .map((s) => s.strokeType ?? "solid");

  if (types.length === 0) return "solid";
  const first = types[0];
  return types.every((t) => t === first) ? first : "mixed";
}

function getStrokeWidthFromShapes(
  shapes: Shape[]
): StrokeWidthPreset | "mixed" {
  const widths = shapes
    .filter((s) => ["rect", "ellipse"].includes(s.type))
    .map((s) => pixelsToStrokeWidth(s.strokeWidth));

  if (widths.length === 0) return "normal";
  const first = widths[0];
  return widths.every((w) => w === first) ? first : "mixed";
}

function getColorFromShapes(shapes: Shape[]): string | "mixed" {
  const colors = shapes
    .filter((s) =>
      ["rect", "ellipse", "line", "arrow", "freedraw"].includes(s.type)
    )
    .map((s) => s.stroke);

  if (colors.length === 0) return "#ffffff";
  const first = colors[0];
  return colors.every((c) => c === first) ? first : "mixed";
}

function getCornerTypeFromShapes(shapes: Shape[]): CornerType | "mixed" {
  const radii = shapes
    .filter((s): s is RectShape => s.type === "rect")
    .map((s) => radiusToCornerType(s.borderRadius));

  if (radii.length === 0) return "rounded";
  const first = radii[0];
  return radii.every((r) => r === first) ? first : "mixed";
}

function getFontFamilyFromShapes(shapes: Shape[]): FontFamilyPreset | "mixed" {
  const fonts = shapes
    .filter((s): s is TextShape => s.type === "text")
    .map((s) => cssFontFamilyToPreset(s.fontFamily));

  if (fonts.length === 0) return "sans";
  const first = fonts[0];
  return fonts.every((f) => f === first) ? first : "mixed";
}

function getTextAlignFromShapes(shapes: Shape[]): TextAlignOption | "mixed" {
  const aligns = shapes
    .filter((s): s is TextShape => s.type === "text")
    .map((s) => s.textAlign);

  if (aligns.length === 0) return "left";
  const first = aligns[0];
  return aligns.every((a) => a === first) ? first : "mixed";
}

function getTextColorFromShapes(shapes: Shape[]): string | "mixed" {
  const colors = shapes
    .filter((s): s is TextShape => s.type === "text")
    .map((s) => s.stroke);

  if (colors.length === 0) return "#ffffff";
  const first = colors[0];
  return colors.every((c) => c === first) ? first : "mixed";
}
