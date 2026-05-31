"use client";

import type { Point } from "@/types/canvas";

interface SelectionBoxProps {
  startWorld: Point;
  currentWorld: Point;
}

export function SelectionBox({ startWorld, currentWorld }: SelectionBoxProps) {
  const x = Math.min(startWorld.x, currentWorld.x);
  const y = Math.min(startWorld.y, currentWorld.y);
  const w = Math.abs(currentWorld.x - startWorld.x);
  const h = Math.abs(currentWorld.y - startWorld.y);

  return (
    <div
      className="absolute pointer-events-none border-dashed"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        borderWidth: "1.5px",
        borderColor: "hsl(24 95% 53%)",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
      }}
    />
  );
}
