import type { Shape, Point } from "@/types/canvas";
import {
  Frame,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Pencil,
  Type,
  Layout,
  Shapes,
  Monitor,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Shape type to icon mapping
 */
const SHAPE_ICON_MAP: Record<Shape["type"], LucideIcon> = {
  frame: Frame,
  rect: Square,
  ellipse: Circle,
  line: Minus,
  arrow: ArrowRight,
  freedraw: Pencil,
  text: Type,
  generatedui: Layout,
  screen: Monitor,
};

/**
 * Get the appropriate Lucide icon for a shape type
 */
export function getShapeIcon(type: Shape["type"]): LucideIcon {
  return SHAPE_ICON_MAP[type] ?? Shapes;
}

/**
 * Generate a readable display name for a shape
 */
export function getShapeName(shape: Shape): string {
  switch (shape.type) {
    case "frame":
      return `Frame ${shape.frameNumber}`;
    case "rect":
      return "Rectangle";
    case "ellipse":
      return "Ellipse";
    case "line":
      return "Line";
    case "arrow":
      return "Arrow";
    case "freedraw":
      return "Drawing";
    case "text": {
      const preview = shape.text.slice(0, 20);
      const suffix = shape.text.length > 20 ? "..." : "";
      return preview ? `Text: "${preview}${suffix}"` : "Text";
    }
    case "generatedui":
      return "Generated UI";
    case "screen":
      return "Screen";
    default:
      return "Shape";
  }
}

/**
 * Calculate the center point of a shape in world coordinates
 */
export function getShapeCenter(shape: Shape): Point {
  switch (shape.type) {
    case "frame":
    case "rect":
    case "ellipse":
    case "generatedui":
    case "screen":
      return {
        x: shape.x + shape.w / 2,
        y: shape.y + shape.h / 2,
      };
    case "line":
    case "arrow":
      return {
        x: (shape.startX + shape.endX) / 2,
        y: (shape.startY + shape.endY) / 2,
      };
    case "freedraw": {
      if (shape.points.length === 0) {
        return { x: 0, y: 0 };
      }
      const sumX = shape.points.reduce((sum, p) => sum + p.x, 0);
      const sumY = shape.points.reduce((sum, p) => sum + p.y, 0);
      return {
        x: sumX / shape.points.length,
        y: sumY / shape.points.length,
      };
    }
    case "text":
      return {
        x: shape.x + (shape.w ?? 50) / 2,
        y: shape.y + (shape.h ?? 20) / 2,
      };
    default:
      return { x: 0, y: 0 };
  }
}

/**
 * Get the bounding box of a shape
 */
export function getShapeBounds(shape: Shape): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  switch (shape.type) {
    case "frame":
    case "rect":
    case "ellipse":
    case "generatedui":
    case "screen":
      return { x: shape.x, y: shape.y, w: shape.w, h: shape.h };
    case "line":
    case "arrow": {
      const minX = Math.min(shape.startX, shape.endX);
      const minY = Math.min(shape.startY, shape.endY);
      const maxX = Math.max(shape.startX, shape.endX);
      const maxY = Math.max(shape.startY, shape.endY);
      return {
        x: minX,
        y: minY,
        w: Math.max(maxX - minX, 1),
        h: Math.max(maxY - minY, 1),
      };
    }
    case "freedraw": {
      if (shape.points.length === 0) {
        return { x: 0, y: 0, w: 1, h: 1 };
      }
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      return {
        x: minX,
        y: minY,
        w: Math.max(maxX - minX, 1),
        h: Math.max(maxY - minY, 1),
      };
    }
    case "text":
      return {
        x: shape.x,
        y: shape.y,
        w: shape.w ?? 50,
        h: shape.h ?? 20,
      };
    default:
      return { x: 0, y: 0, w: 1, h: 1 };
  }
}
