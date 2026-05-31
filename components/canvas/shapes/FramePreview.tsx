export const FramePreview = ({
  startWorld,
  currentWorld,
}: {
  startWorld: { x: number; y: number };
  currentWorld: { x: number; y: number };
}) => {
  const x = Math.min(startWorld.x, currentWorld.x);
  const y = Math.min(startWorld.y, currentWorld.y);
  const w = Math.abs(currentWorld.x - startWorld.x);
  const h = Math.abs(currentWorld.y - startWorld.y);

  return (
    <div
      className="absolute pointer-events-none backdrop-blur-xl bg-white/[0.08] border-2 border-white/[0.12]"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: "12px",
      }}
    />
  );
};
