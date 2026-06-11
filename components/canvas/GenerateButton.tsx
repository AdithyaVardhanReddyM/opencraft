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

  // Calculate frame's top-right corner in screen coordinates
  const frameRightScreenX =
    (frame.x + frame.w) * viewport.scale + viewport.translate.x;
  const frameTopScreenY = frame.y * viewport.scale + viewport.translate.y;

  // Position button above the frame with fixed offset (not scaled)
  const buttonScreenX = frameRightScreenX;
  const buttonScreenY = frameTopScreenY - 44; // 44px above frame top

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onGenerate(frame, containedShapes);
  };

  const buttonContent = (
    <div
      className="fixed z-50 pointer-events-auto scale-100"
      style={{
        left: buttonScreenX,
        top: buttonScreenY,
        transform: "translateX(-100%)", // Align right edge with frame right edge
      }}
    >
      <button
        onClick={handleClick}
        className="flex items-center gap-2 h-9 px-4 rounded-[10px] bg-background hover:bg-muted text-muted-foreground hover:text-foreground shadow-lg backdrop-blur-sm transition-all duration-200"
      >
        <Brush className="h-4 w-4" />
        <span className="text-sm font-medium">Generate Design</span>
      </button>
    </div>
  );

  // Use portal to render at document body level
  if (!mounted) return null;
  return createPortal(buttonContent, document.body);
}
