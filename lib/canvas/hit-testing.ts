import type { Point, Shape } from "@/types/canvas";
import { getTextShapeDimensions } from "./text-utils";

// Hit testing thresholds
const FREEDRAW_HIT_THRESHOLD = 5;
const LINE_HIT_THRESHOLD = 8;
const TEXT_PADDING = 8;
const TEXT_BOUNDS_MARGIN = 2;

/**
 * Calculate distance from a point to a line segment
 */
export function distanceToLineSegment(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx: number, yy: number;
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a point is inside a shape
 */
export function isPointInShape(point: Point, shape: Shape): boolean {
  switch (shape.type) {
    case "frame":
    case "rect": {
      const isInside =
        point.x >= shape.x &&
        point.x <= shape.x + shape.w &&
        point.y >= shape.y &&
        point.y <= shape.y + shape.h;

      if (!isInside) return false;

      if (shape.fill && shape.fill !== "transparent") return true;

      // If no fill, check if near borders
      const distL = Math.abs(point.x - shape.x);
      const distR = Math.abs(point.x - (shape.x + shape.w));
      const distT = Math.abs(point.y - shape.y);
      const distB = Math.abs(point.y - (shape.y + shape.h));

      return (
        distL <= LINE_HIT_THRESHOLD ||
        distR <= LINE_HIT_THRESHOLD ||
        distT <= LINE_HIT_THRESHOLD ||
        distB <= LINE_HIT_THRESHOLD
      );
    }

    case "generatedui":
    case "screen":
      return (
        point.x >= shape.x &&
        point.x <= shape.x + shape.w &&
        point.y >= shape.y &&
        point.y <= shape.y + shape.h
      );

    case "ellipse": {
      const h = shape.x + shape.w / 2;
      const k = shape.y + shape.h / 2;
      const a = shape.w / 2;
      const b = shape.h / 2;

      // Check bounding box first
      if (
        point.x < shape.x ||
        point.x > shape.x + shape.w ||
        point.y < shape.y ||
        point.y > shape.y + shape.h
      ) {
        return false;
      }

      const val =
        Math.pow(point.x - h, 2) / Math.pow(a, 2) +
        Math.pow(point.y - k, 2) / Math.pow(b, 2);

      if (val > 1) return false;

      if (shape.fill && shape.fill !== "transparent") return true;

      // If no fill, check if near edge
      const gradX = (2 * (point.x - h)) / (a * a);
      const gradY = (2 * (point.y - k)) / (b * b);
      const gradLen = Math.sqrt(gradX * gradX + gradY * gradY);

      if (gradLen === 0) return false;

      const dist = Math.abs(val - 1) / gradLen;
      return dist <= LINE_HIT_THRESHOLD;
    }

    case "freedraw":
      for (let i = 0; i < shape.points.length - 1; i++) {
        const p1 = shape.points[i];
        const p2 = shape.points[i + 1];
        if (distanceToLineSegment(point, p1, p2) <= FREEDRAW_HIT_THRESHOLD) {
          return true;
        }
      }
      return false;

    case "arrow":
    case "line":
      return (
        distanceToLineSegment(
          point,
          { x: shape.startX, y: shape.startY },
          { x: shape.endX, y: shape.endY }
        ) <= LINE_HIT_THRESHOLD
      );

    case "text": {
      const { width, height } = getTextShapeDimensions(shape);
      const padding = 8;

      return (
        point.x >= shape.x - padding &&
        point.x <= shape.x + width + padding &&
        point.y >= shape.y - padding &&
        point.y <= shape.y + height + padding
      );
    }

    default:
      return false;
  }
}

/**
 * Check if a point is within the bounding box of a shape (regardless of fill)
 */
function isPointInShapeBounds(point: Point, shape: Shape): boolean {
  switch (shape.type) {
    case "frame":
    case "rect":
    case "ellipse":
    case "generatedui":
    case "screen":
      return (
        point.x >= shape.x &&
        point.x <= shape.x + shape.w &&
        point.y >= shape.y &&
        point.y <= shape.y + shape.h
      );

    case "freedraw": {
      if (shape.points.length === 0) return false;
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return (
        point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
      );
    }

    case "arrow":
    case "line": {
      const minX = Math.min(shape.startX, shape.endX);
      const maxX = Math.max(shape.startX, shape.endX);
      const minY = Math.min(shape.startY, shape.endY);
      const maxY = Math.max(shape.startY, shape.endY);
      // Add threshold for lines since they have no area
      const threshold = LINE_HIT_THRESHOLD;
      return (
        point.x >= minX - threshold &&
        point.x <= maxX + threshold &&
        point.y >= minY - threshold &&
        point.y <= maxY + threshold
      );
    }

    case "text": {
      const { width, height } = getTextShapeDimensions(shape);
      const padding = 8;

      return (
        point.x >= shape.x - padding &&
        point.x <= shape.x + width + padding &&
        point.y >= shape.y - padding &&
        point.y <= shape.y + height + padding
      );
    }

    default:
      return false;
  }
}

/**
 * Calculate the area of a shape's bounding box
 */
function getShapeBoundsArea(shape: Shape): number {
  switch (shape.type) {
    case "frame":
    case "rect":
    case "ellipse":
    case "generatedui":
    case "screen":
      return shape.w * shape.h;

    case "freedraw": {
      if (shape.points.length === 0) return 0;
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      const w = Math.max(...xs) - Math.min(...xs);
      const h = Math.max(...ys) - Math.min(...ys);
      return w * h;
    }

    case "arrow":
    case "line": {
      const w = Math.abs(shape.endX - shape.startX);
      const h = Math.abs(shape.endY - shape.startY);
      return w * h;
    }

    case "text": {
      const { width, height } = getTextShapeDimensions(shape);
      const padding = 8;
      return (width + padding * 2) * (height + padding * 2);
    }

    default:
      return Infinity;
  }
}

/**
 * Get the topmost shape at a point with smart nested shape handling
 *
 * Strategy:
 * 1. Collect all shapes whose bounds contain the point
 * 2. For shapes that actually "hit" (border or fill), prefer the smallest one
 * 3. This ensures clicking on a smaller shape selects it, even if a larger shape is on top
 *
 * Options:
 * - allowBoundsFallback: If true, fall back to bounds-only shapes when no direct hit
 * - excludeScreenShapes: If true, skip screen shapes (used by eraser tool)
 */
export function getShapeAtPoint(
  point: Point,
  shapes: Shape[],
  options?: { allowBoundsFallback?: boolean; excludeScreenShapes?: boolean }
): Shape | null {
  const candidateShapes: Array<{ shape: Shape; hits: boolean; area: number }> =
    [];
  const allowBoundsFallback = options?.allowBoundsFallback ?? true;
  const excludeScreenShapes = options?.excludeScreenShapes ?? false;

  // Collect all shapes whose bounds contain the point
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    // Skip screen shapes if excludeScreenShapes is true (for eraser tool)
    if (excludeScreenShapes && shape.type === "screen") {
      continue;
    }
    if (isPointInShapeBounds(point, shape)) {
      const hits = isPointInShape(point, shape);
      const area = getShapeBoundsArea(shape);
      candidateShapes.push({ shape, hits, area });
    }
  }

  if (candidateShapes.length === 0) return null;

  // Separate shapes that actually hit vs just have bounds
  const hittingShapes = candidateShapes.filter((c) => c.hits);
  const boundsOnlyShapes = candidateShapes.filter((c) => !c.hits);
  const pickSmallest = (
    list: Array<{ shape: Shape; hits: boolean; area: number }>
  ) =>
    list.reduce((smallest, current) =>
      current.area < smallest.area ? current : smallest
    ).shape;

  const hittingNonFrames = hittingShapes.filter(
    (candidate) => candidate.shape.type !== "frame"
  );
  if (hittingNonFrames.length > 0) {
    return pickSmallest(hittingNonFrames);
  }

  if (hittingShapes.length > 0) {
    if (allowBoundsFallback) {
      const boundsNonFrames = boundsOnlyShapes.filter(
        (candidate) => candidate.shape.type !== "frame"
      );
      if (boundsNonFrames.length > 0) {
        return pickSmallest(boundsNonFrames);
      }
    }
    return pickSmallest(hittingShapes);
  }

  if (allowBoundsFallback && boundsOnlyShapes.length > 0) {
    return pickSmallest(boundsOnlyShapes);
  }

  return null;
}
