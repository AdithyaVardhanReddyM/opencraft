import type { Tool, Shape } from "@/types/canvas";

// Stroke type options
export type StrokeType = "solid" | "dashed";

// Stroke width presets
export type StrokeWidthPreset = "thin" | "normal" | "thick";

// Corner type options
export type CornerType = "sharp" | "rounded";

// Control types that can be displayed in the properties bar
export type ControlType =
  | "strokeType"
  | "strokeWidth"
  | "color"
  | "cornerType"
  | "fontFamily"
  | "textAlign"
  | "textColor";

// Font family options
export type FontFamilyPreset = "sans" | "playful" | "mono";

// Text alignment options
export type TextAlignOption = "left" | "center" | "right";

// Font family mapping
export const FONT_FAMILY_MAP: Record<FontFamilyPreset, string> = {
  sans: "Inter, sans-serif",
  playful: "Comic Sans MS, Chalkboard, cursive",
  mono: "JetBrains Mono, Fira Code, monospace",
} as const;

// Stroke width preset to pixel mapping
export const STROKE_WIDTH_MAP: Record<StrokeWidthPreset, number> = {
  thin: 1,
  normal: 2,
  thick: 4,
} as const;

// Corner radius mapping
export const CORNER_RADIUS_MAP: Record<CornerType, number> = {
  sharp: 0,
  rounded: 8,
} as const;

// Curated color palette for dark mode canvas
export const COLOR_PALETTE = [
  "#ffffff", // White
  "#a1a1aa", // Zinc 400
  "#f87171", // Red 400
  "#fb923c", // Orange 400
  "#facc15", // Yellow 400
  "#4ade80", // Green 400
  "#22d3ee", // Cyan 400
  "#60a5fa", // Blue 400
  "#a78bfa", // Violet 400
  "#f472b6", // Pink 400
] as const;

// Default shape properties
export interface ShapeDefaultProperties {
  strokeType: StrokeType;
  strokeWidth: StrokeWidthPreset;
  strokeColor: string;
  cornerType: CornerType;
}

export const DEFAULT_SHAPE_PROPERTIES: ShapeDefaultProperties = {
  strokeType: "solid",
  strokeWidth: "normal",
  strokeColor: "#ffffff",
  cornerType: "rounded",
};

// Tools that support shape properties
const TOOLS_WITH_STROKE_TYPE: Tool[] = [
  "rect",
  "ellipse",
  "line",
  "arrow",
  "freedraw",
];
const TOOLS_WITH_STROKE_WIDTH: Tool[] = ["rect", "ellipse"];
const TOOLS_WITH_COLOR: Tool[] = [
  "rect",
  "ellipse",
  "line",
  "arrow",
  "freedraw",
];
const TOOLS_WITH_CORNER_TYPE: Tool[] = ["rect"];
const TOOLS_WITH_FONT_FAMILY: Tool[] = ["text"];
const TOOLS_WITH_TEXT_ALIGN: Tool[] = ["text"];
const TOOLS_WITH_TEXT_COLOR: Tool[] = ["text"];

// Shape types that support properties
const SHAPES_WITH_STROKE_TYPE = [
  "rect",
  "ellipse",
  "line",
  "arrow",
  "freedraw",
];
const SHAPES_WITH_STROKE_WIDTH = ["rect", "ellipse"];
const SHAPES_WITH_COLOR = ["rect", "ellipse", "line", "arrow", "freedraw"];
const SHAPES_WITH_CORNER_TYPE = ["rect"];
const SHAPES_WITH_FONT_FAMILY = ["text"];
const SHAPES_WITH_TEXT_ALIGN = ["text"];
const SHAPES_WITH_TEXT_COLOR = ["text"];

/**
 * Convert stroke width preset to pixel value
 */
export function strokeWidthToPixels(preset: StrokeWidthPreset): number {
  return STROKE_WIDTH_MAP[preset];
}

/**
 * Convert pixel value to stroke width preset
 * Returns the closest matching preset
 */
export function pixelsToStrokeWidth(pixels: number): StrokeWidthPreset {
  if (pixels <= 1) return "thin";
  if (pixels <= 2) return "normal";
  return "thick";
}

/**
 * Convert corner type to border radius value
 */
export function cornerTypeToRadius(type: CornerType): number {
  return CORNER_RADIUS_MAP[type];
}

/**
 * Convert border radius to corner type
 */
export function radiusToCornerType(radius: number | undefined): CornerType {
  if (radius === undefined || radius === null) return "rounded"; // Default
  return radius === 0 ? "sharp" : "rounded";
}

/**
 * Convert font family preset to CSS font-family value
 */
export function fontFamilyPresetToCSS(preset: FontFamilyPreset): string {
  return FONT_FAMILY_MAP[preset];
}

/**
 * Convert CSS font-family to preset
 */
export function cssFontFamilyToPreset(fontFamily: string): FontFamilyPreset {
  if (
    fontFamily.includes("Comic") ||
    fontFamily.includes("Chalkboard") ||
    fontFamily.includes("cursive")
  ) {
    return "playful";
  }
  if (
    fontFamily.includes("Mono") ||
    fontFamily.includes("Fira") ||
    fontFamily.includes("monospace")
  ) {
    return "mono";
  }
  return "sans";
}

/**
 * Get the controls to display for a given tool
 */
export function getControlsForTool(tool: Tool): ControlType[] {
  const controls: ControlType[] = [];

  if (TOOLS_WITH_STROKE_TYPE.includes(tool)) {
    controls.push("strokeType");
  }
  if (TOOLS_WITH_STROKE_WIDTH.includes(tool)) {
    controls.push("strokeWidth");
  }
  if (TOOLS_WITH_COLOR.includes(tool)) {
    controls.push("color");
  }
  if (TOOLS_WITH_CORNER_TYPE.includes(tool)) {
    controls.push("cornerType");
  }
  if (TOOLS_WITH_FONT_FAMILY.includes(tool)) {
    controls.push("fontFamily");
  }
  if (TOOLS_WITH_TEXT_ALIGN.includes(tool)) {
    controls.push("textAlign");
  }
  if (TOOLS_WITH_TEXT_COLOR.includes(tool)) {
    controls.push("textColor");
  }

  return controls;
}

/**
 * Get the controls to display for selected shapes
 * Returns controls that are applicable to ALL selected shapes
 */
export function getControlsForShapes(shapes: Shape[]): ControlType[] {
  if (shapes.length === 0) return [];

  const controls: ControlType[] = [];

  // Check if all shapes support each control type
  const allSupportStrokeType = shapes.every((s) =>
    SHAPES_WITH_STROKE_TYPE.includes(s.type)
  );
  const allSupportStrokeWidth = shapes.every((s) =>
    SHAPES_WITH_STROKE_WIDTH.includes(s.type)
  );
  const allSupportColor = shapes.every((s) =>
    SHAPES_WITH_COLOR.includes(s.type)
  );
  const allSupportCornerType = shapes.every((s) =>
    SHAPES_WITH_CORNER_TYPE.includes(s.type)
  );
  const allSupportFontFamily = shapes.every((s) =>
    SHAPES_WITH_FONT_FAMILY.includes(s.type)
  );
  const allSupportTextAlign = shapes.every((s) =>
    SHAPES_WITH_TEXT_ALIGN.includes(s.type)
  );
  const allSupportTextColor = shapes.every((s) =>
    SHAPES_WITH_TEXT_COLOR.includes(s.type)
  );

  if (allSupportStrokeType) controls.push("strokeType");
  if (allSupportStrokeWidth) controls.push("strokeWidth");
  if (allSupportColor) controls.push("color");
  if (allSupportCornerType) controls.push("cornerType");
  if (allSupportFontFamily) controls.push("fontFamily");
  if (allSupportTextAlign) controls.push("textAlign");
  if (allSupportTextColor) controls.push("textColor");

  return controls;
}

/**
 * Check if a shape supports a specific property
 */
export function shapeSupportsProperty(
  shape: Shape,
  property: ControlType
): boolean {
  switch (property) {
    case "strokeType":
      return SHAPES_WITH_STROKE_TYPE.includes(shape.type);
    case "strokeWidth":
      return SHAPES_WITH_STROKE_WIDTH.includes(shape.type);
    case "color":
      return SHAPES_WITH_COLOR.includes(shape.type);
    case "cornerType":
      return SHAPES_WITH_CORNER_TYPE.includes(shape.type);
    case "fontFamily":
      return SHAPES_WITH_FONT_FAMILY.includes(shape.type);
    case "textAlign":
      return SHAPES_WITH_TEXT_ALIGN.includes(shape.type);
    case "textColor":
      return SHAPES_WITH_TEXT_COLOR.includes(shape.type);
    default:
      return false;
  }
}
