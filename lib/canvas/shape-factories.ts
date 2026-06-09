import { nanoid } from "nanoid";
import type {
  FrameShape,
  RectShape,
  EllipseShape,
  FreeDrawShape,
  ArrowShape,
  LineShape,
  TextShape,
  GeneratedUIShape,
  ScreenShape,
  Point,
} from "@/types/canvas";
import { measureTextDimensions, TEXT_PLACEHOLDER } from "./text-utils";

// Default shape styling
export const SHAPE_DEFAULTS = {
  stroke: "#ffff",
  strokeWidth: 1,
} as const;

/**
 * Create a frame shape
 */
export function createFrame(params: {
  x: number;
  y: number;
  w: number;
  h: number;
  frameNumber: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
  borderRadius?: number;
}): FrameShape {
  return {
    id: nanoid(),
    type: "frame",
    x: params.x,
    y: params.y,
    w: params.w,
    h: params.h,
    frameNumber: params.frameNumber,
    stroke: "transparent",
    strokeWidth: 0,
    fill: params.fill ?? "rgba(255, 255, 255, 0.05)",
    borderRadius: params.borderRadius ?? 0, // Default to sharp corners for frames
  };
}

/**
 * Create a rectangle shape
 */
export function createRect(params: {
  x: number;
  y: number;
  w: number;
  h: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
  strokeType?: "solid" | "dashed";
  borderRadius?: number;
}): RectShape {
  return {
    id: nanoid(),
    type: "rect",
    x: params.x,
    y: params.y,
    w: params.w,
    h: params.h,
    stroke: params.stroke ?? SHAPE_DEFAULTS.stroke,
    strokeWidth: params.strokeWidth ?? SHAPE_DEFAULTS.strokeWidth,
    fill: params.fill ?? null,
    strokeType: params.strokeType ?? "solid",
    borderRadius: params.borderRadius ?? 8,
  };
}

/**
 * Create an ellipse shape
 */
export function createEllipse(params: {
  x: number;
  y: number;
  w: number;
  h: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
  strokeType?: "solid" | "dashed";
}): EllipseShape {
  return {
    id: nanoid(),
    type: "ellipse",
    x: params.x,
    y: params.y,
    w: params.w,
    h: params.h,
    stroke: params.stroke ?? SHAPE_DEFAULTS.stroke,
    strokeWidth: params.strokeWidth ?? SHAPE_DEFAULTS.strokeWidth,
    fill: params.fill ?? null,
    strokeType: params.strokeType ?? "solid",
  };
}

/**
 * Create a freedraw shape
 */
export function createFreeDraw(params: {
  points: Point[];
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
  strokeType?: "solid" | "dashed";
}): FreeDrawShape {
  return {
    id: nanoid(),
    type: "freedraw",
    points: params.points,
    stroke: params.stroke ?? SHAPE_DEFAULTS.stroke,
    strokeWidth: params.strokeWidth ?? SHAPE_DEFAULTS.strokeWidth,
    fill: params.fill ?? null,
    strokeType: params.strokeType ?? "solid",
  };
}

/**
 * Create an arrow shape
 */
export function createArrow(params: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
  strokeType?: "solid" | "dashed";
}): ArrowShape {
  return {
    id: nanoid(),
    type: "arrow",
    startX: params.startX,
    startY: params.startY,
    endX: params.endX,
    endY: params.endY,
    stroke: params.stroke ?? SHAPE_DEFAULTS.stroke,
    strokeWidth: params.strokeWidth ?? SHAPE_DEFAULTS.strokeWidth,
    fill: params.fill ?? null,
    strokeType: params.strokeType ?? "solid",
  };
}

/**
 * Create a line shape
 */
export function createLine(params: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
  strokeType?: "solid" | "dashed";
}): LineShape {
  return {
    id: nanoid(),
    type: "line",
    startX: params.startX,
    startY: params.startY,
    endX: params.endX,
    endY: params.endY,
    stroke: params.stroke ?? SHAPE_DEFAULTS.stroke,
    strokeWidth: params.strokeWidth ?? SHAPE_DEFAULTS.strokeWidth,
    fill: params.fill ?? null,
    strokeType: params.strokeType ?? "solid",
  };
}

/**
 * Create a text shape
 */
export function createText(params: {
  x: number;
  y: number;
  id?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  textDecoration?: "none" | "underline" | "line-through";
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
}): TextShape {
  const fontSize = params.fontSize ?? 16;
  const fontFamily = params.fontFamily ?? "Inter, sans-serif";
  const fontWeight = params.fontWeight ?? 400;
  const fontStyle = params.fontStyle ?? "normal";
  const textValue = params.text ?? TEXT_PLACEHOLDER;
  const textAlign = params.textAlign ?? "left";
  const textDecoration = params.textDecoration ?? "none";
  const lineHeight = params.lineHeight ?? 1.2;
  const letterSpacing = params.letterSpacing ?? 0;
  const textTransform = params.textTransform ?? "none";

  const shape: TextShape = {
    id: params.id ?? nanoid(),
    type: "text",
    x: params.x,
    y: params.y,
    text: textValue,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
    textAlign,
    textDecoration,
    lineHeight,
    letterSpacing,
    textTransform,
    stroke: params.stroke ?? SHAPE_DEFAULTS.stroke,
    strokeWidth: params.strokeWidth ?? SHAPE_DEFAULTS.strokeWidth,
    fill: params.fill ?? "transparent",
  };

  const { width, height } = measureTextDimensions(shape);
  shape.w = width;
  shape.h = height;

  return shape;
}

/**
 * Create a generated UI shape
 */
export function createGeneratedUI(params: {
  x: number;
  y: number;
  w: number;
  h: number;
  uiSpecData: string | null;
  sourceFrameId: string;
  id?: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
  isWorkflowPage?: boolean;
}): GeneratedUIShape {
  return {
    id: params.id ?? nanoid(),
    type: "generatedui",
    x: params.x,
    y: params.y,
    w: params.w,
    h: params.h,
    uiSpecData: params.uiSpecData,
    sourceFrameId: params.sourceFrameId,
    isWorkflowPage: params.isWorkflowPage,
    stroke: "transparent",
    strokeWidth: 0,
    fill: params.fill ?? null,
  };
}

// Screen shape default dimensions
export const SCREEN_DEFAULTS = {
  width: 1440,
  height: 1024,
  minWidth: 320,
  minHeight: 240,
} as const;

/**
 * Create a screen shape for displaying AI-generated web content
 */
export function createScreen(params: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  screenId: string; // Convex document ID
  id?: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
}): ScreenShape {
  return {
    id: params.id ?? nanoid(),
    type: "screen",
    x: params.x,
    y: params.y,
    w: params.w ?? SCREEN_DEFAULTS.width,
    h: params.h ?? SCREEN_DEFAULTS.height,
    screenId: params.screenId,
    stroke: "transparent",
    strokeWidth: 0,
    fill: params.fill ?? null,
  };
}
