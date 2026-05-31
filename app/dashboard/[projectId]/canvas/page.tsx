"use client";

import { CanvasProvider } from "@/contexts/CanvasContext";
import { useInfiniteCanvas } from "@/hooks/use-infinite-canvas";
import { useCanvasCursor } from "@/hooks/use-canvas-cursor";
import { Toolbar } from "@/components/canvas/Toolbar";
import { ZoomBar } from "@/components/canvas/ZoomBar";
import { HistoryPill } from "@/components/canvas/HistoryPill";
import { BoundingBox } from "@/components/canvas/BoundingBox";
import { SelectionBox } from "@/components/canvas/SelectionBox";

// Import shape components
import { Frame } from "@/shapes/frame";
import { Rectangle } from "@/shapes/rectangle";
import { Elipse } from "@/shapes/elipse";
import { Line } from "@/shapes/line";
import { Arrow } from "@/shapes/arrow";
import { Stroke } from "@/shapes/stroke";
import { Text } from "@/shapes/text";

// Import preview components
import { FramePreview } from "@/shapes/frame/preview";
import { RectanglePreview } from "@/shapes/rectangle/preview";
import { ElipsePreview } from "@/shapes/elipse/preview";
import { LinePreview } from "@/shapes/line/preview";
import { ArrowPreview } from "@/shapes/arrow/preview";
import { FreeDrawStrokePreview } from "@/shapes/stroke/preview";

function CanvasContent() {
  const {
    viewport,
    shapes,
    currentTool,
    selectedShapes,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    attachCanvasRef,
    selectTool,
    getDraftShape,
    getFreeDrawPoints,
    zoomIn,
    zoomOut,
    getSelectionBox,
  } = useInfiniteCanvas();

  const { cursorClass } = useCanvasCursor();

  const draftShape = getDraftShape();
  const freeDrawPoints = getFreeDrawPoints();
  const selectionBox = getSelectionBox();

  // TODO: Implement undo/redo functionality
  const handleUndo = () => {
    console.log("Undo action - to be implemented");
  };

  const handleRedo = () => {
    console.log("Redo action - to be implemented");
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-accent">
      {/* Toolbar */}
      <Toolbar currentTool={currentTool} onToolSelect={selectTool} />

      {/* Zoom Bar */}
      <ZoomBar
        scale={viewport.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        minScale={viewport.minScale}
        maxScale={viewport.maxScale}
      />

      {/* History Pill */}
      <HistoryPill
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={false}
        canRedo={false}
      />

      {/* Canvas - Outer container for event handling */}
      <div
        ref={attachCanvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className={`h-full w-full ${cursorClass} relative overflow-hidden`}
        style={{
          touchAction: "none",
        }}
      >
        {/* Inner container for transform */}
        <div
          className="relative"
          style={{
            transform: `translate(${viewport.translate.x}px, ${viewport.translate.y}px) scale(${viewport.scale})`,
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
          }}
        >
          {/* Render shapes using component files */}
          {shapes.map((shape) => {
            if (shape.type === "frame") {
              return <Frame key={shape.id} shape={shape} />;
            }
            if (shape.type === "rect") {
              return <Rectangle key={shape.id} shape={shape} />;
            }
            if (shape.type === "ellipse") {
              return <Elipse key={shape.id} shape={shape} />;
            }
            if (shape.type === "freedraw") {
              return <Stroke key={shape.id} shape={shape} />;
            }
            if (shape.type === "line") {
              return <Line key={shape.id} shape={shape} />;
            }
            if (shape.type === "arrow") {
              return <Arrow key={shape.id} shape={shape} />;
            }
            if (shape.type === "text") {
              return <Text key={shape.id} shape={shape} />;
            }
            if (shape.type === "generatedui") {
              return (
                <div
                  key={shape.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: shape.x,
                    top: shape.y,
                    width: shape.w,
                    height: shape.h,
                  }}
                >
                  <div
                    className="h-full w-full overflow-hidden border border-gray-200 bg-white"
                    dangerouslySetInnerHTML={{
                      __html: shape.uiSpecData || "",
                    }}
                  />
                </div>
              );
            }
            return null;
          })}

          {/* Render draft shapes using preview components */}
          {draftShape && (
            <>
              {draftShape.type === "frame" && (
                <FramePreview
                  startWorld={draftShape.startWorld}
                  currentWorld={draftShape.currentWorld}
                />
              )}
              {draftShape.type === "rect" && (
                <RectanglePreview
                  startWorld={draftShape.startWorld}
                  currentWorld={draftShape.currentWorld}
                />
              )}
              {draftShape.type === "ellipse" && (
                <ElipsePreview
                  startWorld={draftShape.startWorld}
                  currentWorld={draftShape.currentWorld}
                />
              )}
              {draftShape.type === "line" && (
                <LinePreview
                  startWorld={draftShape.startWorld}
                  currentWorld={draftShape.currentWorld}
                />
              )}
              {draftShape.type === "arrow" && (
                <ArrowPreview
                  startWorld={draftShape.startWorld}
                  currentWorld={draftShape.currentWorld}
                />
              )}
            </>
          )}

          {/* Render freedraw preview */}
          {freeDrawPoints.length > 0 && (
            <FreeDrawStrokePreview points={freeDrawPoints} />
          )}

          {/* Render selection box */}
          {selectionBox && (
            <SelectionBox
              startWorld={selectionBox.start}
              currentWorld={selectionBox.current}
            />
          )}

          {/* Render bounding boxes for selected shapes */}
          {Object.keys(selectedShapes).map((id) => {
            const shape = shapes.find((s) => s.id === id);
            if (!shape) return null;

            return (
              <BoundingBox
                key={`bbox-${id}`}
                shape={shape}
                viewport={viewport}
                onResizeStart={(corner, bounds) => {
                  window.dispatchEvent(
                    new CustomEvent("shape-resize-start", {
                      detail: { shapeId: id, corner, bounds },
                    })
                  );
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CanvasPage() {
  return (
    <CanvasProvider>
      <CanvasContent />
    </CanvasProvider>
  );
}
