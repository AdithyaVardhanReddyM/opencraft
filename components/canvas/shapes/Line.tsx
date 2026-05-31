import { LineShape } from "@/types/canvas";

export const Line = ({ shape }: { shape: LineShape }) => {
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
