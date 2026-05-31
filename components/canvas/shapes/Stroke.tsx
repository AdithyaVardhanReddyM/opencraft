import { FreeDrawShape } from "@/types/canvas";

export const Stroke = ({ shape }: { shape: FreeDrawShape }) => {
  if (shape.points.length < 2) return null;

  const pathData = shape.points.reduce((acc, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${acc} L ${point.x} ${point.y}`;
  }, "");

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
      }}
    >
      <path
        d={pathData}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
