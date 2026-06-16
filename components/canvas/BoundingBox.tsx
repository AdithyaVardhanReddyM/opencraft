"use client";

import type { ResizeHandle, Shape, ViewportState } from "@/types/canvas";
import { getTextShapeDimensions } from "@/lib/canvas/text-utils";

interface BoundingBoxProps {
  shape: Shape;
  viewport: ViewportState;
  onResizeStart: (corner: ResizeHandle, bounds: Bounds) => void;
  showEdgeHandles?: boolean;
}

interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

function calculateBounds(shape: Shape): Bounds {
  switch (shape.type) {
    case "frame":
    case "rect":
    case "ellipse":
      return {
        x: shape.x - 4,
        y: shape.y - 4,
        w: shape.w + 8,
        h: shape.h + 8,
      };
    case "generatedui":
    case "screen":
      return { x: shape.x, y: shape.y, w: shape.w, h: shape.h };

    case "text": {
      const { width, height } = getTextShapeDimensions(shape);
      return {
        x: shape.x - 4,
        y: shape.y - 4,
        w: width + 8,
        h: height + 8,
      };
    }

    case "freedraw": {
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      return {
        x: minX - 5,
        y: minY - 5,
        w: maxX - minX + 10,
        h: maxY - minY + 10,
      };
    }

    case "arrow":
    case "line": {
      const minX = Math.min(shape.startX, shape.endX);
      const minY = Math.min(shape.startY, shape.endY);
      const maxX = Math.max(shape.startX, shape.endX);
      const maxY = Math.max(shape.startY, shape.endY);
      return {
        x: minX - 5,
        y: minY - 5,
        w: maxX - minX + 10,
        h: maxY - minY + 10,
      };
    }
  }
}

export function BoundingBox({
  shape,
  viewport,
  onResizeStart,
  showEdgeHandles = true,
}: BoundingBoxProps) {
  const bounds = calculateBounds(shape);
  const handleSize = 8;

  const isLineOrArrow = shape.type === "arrow" || shape.type === "line";

  // Screen shapes render a live iframe in their interior. An iframe is a
  // separate browsing context, so any pointer event that lands on it is
  // swallowed before it can reach the canvas's onPointerDown — which means the
  // canvas move logic never starts and the screen can't be dragged. To restore
  // dragging, we lay a thin draggable "frame" over the screen's perimeter. The
  // bounding box sits above the iframe in the DOM, so these strips intercept the
  // pointerdown at the edges and (crucially) let it bubble to the canvas, which
  // then starts the move via hit-testing. We use inline pointerEvents (not the
  // `pointer-events-auto` class) so the canvas does not treat them as
  // interactive UI and skip them — see isInteractiveTarget in use-infinite-canvas.
  const showMoveBorder = shape.type === "screen";
  // Keep the grab region a roughly constant on-screen size regardless of zoom,
  // capped so it never eats more than a quarter of a small screen's interior.
  const moveBorderThickness = Math.min(
    14 / viewport.scale,
    bounds.w / 4,
    bounds.h / 4
  );
  const moveStripStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "auto",
    cursor: "move",
    // Transparent — the existing selection border already shows the edge.
  };

  const handlePointerDown = (corner: ResizeHandle, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onResizeStart(corner, bounds);

    const pointerId = e.pointerId;

    // Dispatch custom event with client coordinates
    window.dispatchEvent(
      new CustomEvent("shape-resize-start", {
        detail: {
          shapeId: shape.id,
          corner,
          bounds,
          clientX: e.clientX,
          clientY: e.clientY,
        },
      })
    );

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      window.dispatchEvent(
        new CustomEvent("shape-resize-move", {
          detail: { clientX: event.clientX, clientY: event.clientY },
        })
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.dispatchEvent(new CustomEvent("shape-resize-end"));
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  // For line/arrow shapes, only show endpoint handles
  if (isLineOrArrow) {
    const lineShape = shape as Extract<Shape, { type: "arrow" | "line" }>;
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: bounds.x,
          top: bounds.y,
          width: bounds.w,
          height: bounds.h,
        }}
      >
        {/* Start point handle */}
        <div
          className="absolute pointer-events-auto cursor-move"
          style={{
            left: lineShape.startX - bounds.x - handleSize / 2,
            top: lineShape.startY - bounds.y - handleSize / 2,
            width: handleSize,
            height: handleSize,
            backgroundColor: "white",
            border: "2px solid oklch(0.5665 0.1947 256.1696)",
            borderRadius: "50%",
          }}
          onPointerDown={(e) => handlePointerDown("line-start", e)}
        />

        {/* End point handle */}
        <div
          className="absolute pointer-events-auto cursor-move"
          style={{
            left: lineShape.endX - bounds.x - handleSize / 2,
            top: lineShape.endY - bounds.y - handleSize / 2,
            width: handleSize,
            height: handleSize,
            backgroundColor: "white",
            border: "2px solid oklch(0.5665 0.1947 256.1696)",
            borderRadius: "50%",
          }}
          onPointerDown={(e) => handlePointerDown("line-end", e)}
        />
      </div>
    );
  }

  // For rectangular shapes, show 8 resize handles
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.w,
        height: bounds.h,
      }}
    >
      {/* Border */}
      <div
        className="absolute inset-0 border-2 pointer-events-none"
        style={{
          borderColor: "oklch(0.5665 0.1947 256.1696)",
        }}
      />

      {/* Draggable move-border for screen shapes — a thin frame over the
          perimeter that lets the user grab the screen and reposition it even
          when an interactive iframe fills the interior. Rendered before the
          resize handles so the corner/edge handles stay on top and keep resize
          priority. */}
      {showMoveBorder && (
        <>
          <div
            style={{
              ...moveStripStyle,
              left: 0,
              top: 0,
              width: "100%",
              height: moveBorderThickness,
            }}
          />
          <div
            style={{
              ...moveStripStyle,
              left: 0,
              bottom: 0,
              width: "100%",
              height: moveBorderThickness,
            }}
          />
          <div
            style={{
              ...moveStripStyle,
              left: 0,
              top: 0,
              width: moveBorderThickness,
              height: "100%",
            }}
          />
          <div
            style={{
              ...moveStripStyle,
              right: 0,
              top: 0,
              width: moveBorderThickness,
              height: "100%",
            }}
          />
        </>
      )}

      {/* Corner handles */}
      {/* Northwest */}
      <div
        className="absolute pointer-events-auto cursor-nw-resize"
        style={{
          left: -handleSize / 2,
          top: -handleSize / 2,
          width: handleSize,
          height: handleSize,
          backgroundColor: "white",
          border: "2px solid oklch(0.5665 0.1947 256.1696)",
        }}
        onPointerDown={(e) => handlePointerDown("nw", e)}
      />

      {/* Northeast */}
      <div
        className="absolute pointer-events-auto cursor-ne-resize"
        style={{
          right: -handleSize / 2,
          top: -handleSize / 2,
          width: handleSize,
          height: handleSize,
          backgroundColor: "white",
          border: "2px solid oklch(0.5665 0.1947 256.1696)",
        }}
        onPointerDown={(e) => handlePointerDown("ne", e)}
      />

      {/* Southwest */}
      <div
        className="absolute pointer-events-auto cursor-sw-resize"
        style={{
          left: -handleSize / 2,
          bottom: -handleSize / 2,
          width: handleSize,
          height: handleSize,
          backgroundColor: "white",
          border: "2px solid oklch(0.5665 0.1947 256.1696)",
        }}
        onPointerDown={(e) => handlePointerDown("sw", e)}
      />

      {/* Southeast */}
      <div
        className="absolute pointer-events-auto cursor-se-resize"
        style={{
          right: -handleSize / 2,
          bottom: -handleSize / 2,
          width: handleSize,
          height: handleSize,
          backgroundColor: "white",
          border: "2px solid oklch(0.5665 0.1947 256.1696)",
        }}
        onPointerDown={(e) => handlePointerDown("se", e)}
      />

      {showEdgeHandles && (
        <>
          {/* Edge handles */}
          {/* North */}
          <div
            className="absolute pointer-events-auto cursor-n-resize"
            style={{
              left: `calc(50% - ${handleSize / 2}px)`,
              top: -handleSize / 2,
              width: handleSize,
              height: handleSize,
              backgroundColor: "white",
              border: "2px solid oklch(0.5665 0.1947 256.1696)",
            }}
            onPointerDown={(e) => handlePointerDown("n", e)}
          />

          {/* South */}
          <div
            className="absolute pointer-events-auto cursor-s-resize"
            style={{
              left: `calc(50% - ${handleSize / 2}px)`,
              bottom: -handleSize / 2,
              width: handleSize,
              height: handleSize,
              backgroundColor: "white",
              border: "2px solid oklch(0.5665 0.1947 256.1696)",
            }}
            onPointerDown={(e) => handlePointerDown("s", e)}
          />

          {/* East */}
          <div
            className="absolute pointer-events-auto cursor-e-resize"
            style={{
              right: -handleSize / 2,
              top: `calc(50% - ${handleSize / 2}px)`,
              width: handleSize,
              height: handleSize,
              backgroundColor: "white",
              border: "2px solid oklch(0.5665 0.1947 256.1696)",
            }}
            onPointerDown={(e) => handlePointerDown("e", e)}
          />

          {/* West */}
          <div
            className="absolute pointer-events-auto cursor-w-resize"
            style={{
              left: -handleSize / 2,
              top: `calc(50% - ${handleSize / 2}px)`,
              width: handleSize,
              height: handleSize,
              backgroundColor: "white",
              border: "2px solid oklch(0.5665 0.1947 256.1696)",
            }}
            onPointerDown={(e) => handlePointerDown("w", e)}
          />
        </>
      )}
    </div>
  );
}
