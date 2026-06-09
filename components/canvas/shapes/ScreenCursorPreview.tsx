"use client";

import { Monitor } from "lucide-react";
import { SCREEN_DEFAULTS } from "@/lib/canvas/shape-factories";

interface ScreenCursorPreviewProps {
  /** World X coordinate (cursor position) */
  worldX: number;
  /** World Y coordinate (cursor position) */
  worldY: number;
}

/**
 * Ghost preview component that follows the cursor when the screen tool is active.
 * The preview is centered on the cursor position.
 */
export function ScreenCursorPreview({
  worldX,
  worldY,
}: ScreenCursorPreviewProps) {
  const w = SCREEN_DEFAULTS.width;
  const h = SCREEN_DEFAULTS.height;

  // Center the preview on the cursor
  const x = worldX - w / 2;
  const y = worldY - h / 2;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
      }}
    >
      <div
        className="w-full h-full rounded-lg border-2 border-dashed border-orange-500/50 bg-orange-500/5 flex items-center justify-center"
        style={{
          backdropFilter: "blur(2px)",
        }}
      >
        <div className="flex flex-col items-center gap-2 text-orange-500/70">
          <Monitor className="w-10 h-10" />
          <span className="text-base font-medium">Screen</span>
          <span className="text-sm opacity-70">
            {w} × {h}
          </span>
        </div>
      </div>
    </div>
  );
}
