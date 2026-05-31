export const LinePreview = ({
  startWorld,
  currentWorld,
}: {
  startWorld: { x: number; y: number };
  currentWorld: { x: number; y: number };
}) => {
  const length = Math.sqrt(
    Math.pow(currentWorld.x - startWorld.x, 2) +
      Math.pow(currentWorld.y - startWorld.y, 2)
  );
  const angle = Math.atan2(
    currentWorld.y - startWorld.y,
    currentWorld.x - startWorld.x
  );

  return (
    <div
      className="absolute pointer-events-none bg-gray-400"
      style={{
        left: startWorld.x,
        top: startWorld.y,
        width: length,
        height: 2,
        transformOrigin: "0 0",
        transform: `rotate(${angle}rad)`,
      }}
    />
  );
};
