export const ArrowPreview = ({
  startWorld,
  currentWorld,
}: {
  startWorld: { x: number; y: number };
  currentWorld: { x: number; y: number };
}) => {
  const arrowHeadSize = 12;

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: Math.min(startWorld.x, currentWorld.x) - arrowHeadSize,
        top: Math.min(startWorld.y, currentWorld.y) - arrowHeadSize,
        width: Math.abs(currentWorld.x - startWorld.x) + arrowHeadSize * 2,
        height: Math.abs(currentWorld.y - startWorld.y) + arrowHeadSize * 2,
        overflow: "visible",
      }}
    >
      <defs>
        <marker
          id="arrowhead-preview"
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
            fill="#9ca3af"
          />
        </marker>
      </defs>
      <line
        x1={
          startWorld.x - Math.min(startWorld.x, currentWorld.x) + arrowHeadSize
        }
        y1={
          startWorld.y - Math.min(startWorld.y, currentWorld.y) + arrowHeadSize
        }
        x2={
          currentWorld.x -
          Math.min(startWorld.x, currentWorld.x) +
          arrowHeadSize
        }
        y2={
          currentWorld.y -
          Math.min(startWorld.y, currentWorld.y) +
          arrowHeadSize
        }
        stroke="#9ca3af"
        strokeWidth={2}
        markerEnd="url(#arrowhead-preview)"
      />
    </svg>
  );
};
