import { useEffect, useState } from "react";
import { useCanvasContext } from "@/contexts/CanvasContext";
import {
  getCursorForTool,
  getCursorForViewportMode,
  shouldShowGrabCursor,
  type CursorClass,
} from "@/lib/canvas/cursor-utils";

interface UseCanvasCursorReturn {
  cursorClass: CursorClass;
}

/**
 * Custom hook to manage canvas cursor based on tool, viewport mode, and keyboard modifiers
 */
export function useCanvasCursor(): UseCanvasCursorReturn {
  const { shapes, viewport } = useCanvasContext();
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Listen for Shift key press/release
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "Shift") {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Determine cursor based on priority: panning > shift > tool
  const cursorClass: CursorClass = (() => {
    // Priority 1: Active panning
    const viewportCursor = getCursorForViewportMode(viewport.mode);
    if (viewportCursor) {
      return viewportCursor;
    }

    // Priority 2: Shift key held (grab cursor)
    if (shouldShowGrabCursor(isShiftPressed, viewport.mode)) {
      return "cursor-grab";
    }

    // Priority 3: Current tool cursor
    return getCursorForTool(shapes.tool);
  })();

  return { cursorClass };
}
