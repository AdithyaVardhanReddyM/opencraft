import type { Tool, ViewportMode } from "@/types/canvas";

// Cursor class names
export type CursorClass =
  | "cursor-select"
  | "cursor-pen"
  | "cursor-eraser"
  | "cursor-crosshair"
  | "cursor-text"
  | "cursor-grab"
  | "cursor-grabbing";

// Tool to cursor mapping
export const TOOL_CURSOR_MAP: Record<Tool, CursorClass> = {
  select: "cursor-select",
  frame: "cursor-crosshair",
  rect: "cursor-crosshair",
  ellipse: "cursor-crosshair",
  freedraw: "cursor-pen",
  arrow: "cursor-crosshair",
  line: "cursor-crosshair",
  text: "cursor-text",
  eraser: "cursor-eraser",
};

/**
 * Get the cursor class for a given tool
 */
export function getCursorForTool(tool: Tool): CursorClass {
  return TOOL_CURSOR_MAP[tool];
}

/**
 * Get the cursor class for a given viewport mode
 * Returns null if the viewport mode doesn't require a special cursor
 */
export function getCursorForViewportMode(
  mode: ViewportMode
): CursorClass | null {
  if (mode === "panning" || mode === "shiftPanning") {
    return "cursor-grabbing";
  }
  return null;
}

/**
 * Determine if the grab cursor should be shown
 * (when Shift is pressed but not actively panning)
 */
export function shouldShowGrabCursor(
  isShiftPressed: boolean,
  mode: ViewportMode
): boolean {
  return isShiftPressed && mode === "idle";
}
