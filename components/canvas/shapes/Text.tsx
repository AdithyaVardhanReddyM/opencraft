import { TextShape } from "@/types/canvas";

export const Text = ({ shape }: { shape: TextShape }) => (
  <div
    className="absolute pointer-events-none whitespace-pre-wrap"
    style={{
      left: shape.x,
      top: shape.y,
      color: shape.stroke,
      fontSize: `${shape.fontSize}px`,
      fontFamily: shape.fontFamily,
      fontWeight: shape.fontWeight,
      fontStyle: shape.fontStyle,
      textAlign: shape.textAlign,
      textDecoration: shape.textDecoration,
      lineHeight: shape.lineHeight,
      letterSpacing: `${shape.letterSpacing}px`,
      textTransform: shape.textTransform,
    }}
  >
    {shape.text || "Type something..."}
  </div>
);
