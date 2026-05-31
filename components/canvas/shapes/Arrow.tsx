import { ArrowShape } from "@/types/canvas";

export const Arrow = ({ shape }: { shape: ArrowShape }) => {
  const length = Math.sqrt(
    Math.pow(shape.endX - shape.startX, 2) +
      Math.pow(shape.endY - shape.startY, 2)
  );
  const angle = Math.atan2(
    shape.endY - shape.startY,
    shape.endX - shape.startX
  );
  const arrowHeadSize = 12;

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: Math.min(shape.startX, shape.endX) - arrowHeadSize,
        top: Math.min(shape.startY, shape.endY) - arrowHeadSize,
        width: Math.abs(shape.endX - shape.startX) + arrowHeadSize * 2,
        height: Math.abs(shape.endY - shape.startY) + arrowHeadSize * 2,
        overflow: "visible",
      }}
    >
      <defs>
        <marker
          id={`arrowhead-${shape.id}`}
          markerWidth={arrowHeadSize}
          markerHeight={arrowHeadSize}
          refX={arrowHeadSize - 2}
          refY={arrowHeadSize / 2}
          orient="auto"
        >
          <polygon
            points={`0 0, ${arrowHeadSize} ${
              arrowHeadSize / 2
            }, 0 ${arrowHeadSize}`}
            fill={shape.stroke}
          />
        </marker>
      </defs>
      <line
        x1={shape.startX - Math.min(shape.startX, shape.endX) + arrowHeadSize}
        y1={shape.startY - Math.min(shape.startY, shape.endY) + arrowHeadSize}
        x2={shape.endX - Math.min(shape.startX, shape.endX) + arrowHeadSize}
        y2={shape.endY - Math.min(shape.startY, shape.endY) + arrowHeadSize}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        markerEnd={`url(#arrowhead-${shape.id})`}
      />
    </svg>
  );
};
