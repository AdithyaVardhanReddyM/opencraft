import { RectShape } from "@/types/canvas";

export const Rectangle = ({ shape }: { shape: RectShape }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: shape.x,
      top: shape.y,
      width: shape.w,
      height: shape.h,
      borderColor: shape.stroke,
      borderWidth: shape.strokeWidth,
      borderStyle: shape.strokeType === "dashed" ? "dashed" : "solid",
      backgroundColor: shape.fill ?? "transparent",
      borderRadius: shape.borderRadius ?? 8,
    }}
  />
);
