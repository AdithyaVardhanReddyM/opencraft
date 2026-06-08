import { LineShape } from "@/types/canvas";

export const Line = ({ shape }: { shape: LineShape }) => {
  const isDashed = shape.strokeType === "dashed";

  // For dashed lines, use SVG for proper dash rendering
  if (isDashed) {
    const minX = Math.min(shape.startX, shape.endX);
    const minY = Math.min(shape.startY, shape.endY);
    const width = Math.abs(shape.endX - shape.startX) || 1;
    const height = Math.abs(shape.endY - shape.startY) || 1;
    const padding = shape.strokeWidth;

    return (
      <svg
        className="absolute pointer-events-none overflow-visible"
        style={{
          left: minX - padding,
          top: minY - padding,
          width: width + padding * 2,
          height: height + padding * 2,
        }}
      >
        <line
          x1={shape.startX - minX + padding}
          y1={shape.startY - minY + padding}
          x2={shape.endX - minX + padding}
          y2={shape.endY - minY + padding}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeDasharray="8 4"
        />
      </svg>
    );
  }

  // For solid lines, use the optimized div approach
  const length = Math.sqrt(
    Math.pow(shape.endX - shape.startX, 2) +
      Math.pow(shape.endY - shape.startY, 2)
  );
  const angle = Math.atan2(
    shape.endY - shape.startY,
    shape.endX - shape.startX
  );

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: shape.startX,
        top: shape.startY,
        width: length,
        height: shape.strokeWidth,
        backgroundColor: shape.stroke,
        transformOrigin: "0 0",
        transform: `rotate(${angle}rad)`,
      }}
    />
  );
};
