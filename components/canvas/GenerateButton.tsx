"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Brush, Pencil } from "lucide-react";
import type { FrameShape, Shape, ViewportState } from "@/types/canvas";

interface GenerateButtonProps {
  frame: FrameShape;
  containedShapes: Shape[];
  viewport: ViewportState;
  onGenerate: (frame: FrameShape, containedShapes: Shape[]) => void;
}

/**
 * Generate button that appears above frames containing shapes.
 * Triggers the frame-to-AI generation workflow.
 * Uses a portal to render at document body level to avoid transform contexts.
 */
export function GenerateButton({
  frame,
  containedShapes,
  viewport,
  onGenerate,
}: GenerateButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Frame's top-right corner in screen coordinates
  const frameRightScreenX =
    (frame.x + frame.w) * viewport.scale + viewport.translate.x;
  const frameTopScreenY = frame.y * viewport.scale + viewport.translate.y;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onGenerate(frame, containedShapes);
  };

  // The button scales together with the canvas (viewport.scale) so it stays
  // proportional to the frame as you zoom — just like the "Frame N" label,
  // which lives inside the scaled transform container. The anchor sits at the
  // frame's top-right corner and the button hangs above it, right-aligned.
  const buttonContent = (
    <div
      className="fixed z-50 pointer-events-auto"
      style={{
        left: frameRightScreenX,
        top: frameTopScreenY,
        transform: `scale(${viewport.scale})`,
        transformOrigin: "0 0",
      }}
    >
      <div className="absolute bottom-0 right-0 -translate-y-1.5">
        <button
          onClick={handleClick}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-background hover:bg-muted text-muted-foreground hover:text-foreground shadow-lg backdrop-blur-sm transition-all duration-200"
        >
          <Brush className="h-3 w-3" />
          <span className="text-xs font-medium whitespace-nowrap">
            Generate Design
          </span>
        </button>
      </div>
    </div>
  );

  // Use portal to render at document body level
  if (!mounted) return null;
  return createPortal(buttonContent, document.body);
}
