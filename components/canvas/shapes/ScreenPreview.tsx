"use client";

import { Monitor } from "lucide-react";

interface ScreenPreviewProps {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Preview component shown while placing a Screen shape
 */
export function ScreenPreview({ x, y, w, h }: ScreenPreviewProps) {
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
        className="w-full h-full rounded-lg border-2 border-dashed border-orange-500/60 bg-orange-500/5 flex items-center justify-center"
        style={{
          backdropFilter: "blur(4px)",
        }}
      >
        <div className="flex flex-col items-center gap-2 text-orange-500/80">
          <Monitor className="w-8 h-8" />
          <span className="text-sm font-medium">Screen</span>
          <span className="text-xs opacity-60">
            {Math.round(w)} × {Math.round(h)}
          </span>
        </div>
      </div>
    </div>
  );
}
