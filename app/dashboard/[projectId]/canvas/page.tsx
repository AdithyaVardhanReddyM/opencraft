"use client";

import { use, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { CanvasProvider, useCanvasContext } from "@/contexts/CanvasContext";
import { BackButton } from "@/components/canvas/BackButton";
import { CanvasActions } from "@/components/canvas/CanvasActions";
import { useInfiniteCanvas } from "@/hooks/use-infinite-canvas";
import { useCanvasCursor } from "@/hooks/use-canvas-cursor";
import { useAutosave } from "@/hooks/use-autosave";
import { Toolbar } from "@/components/canvas/Toolbar";
import { ZoomBar } from "@/components/canvas/ZoomBar";
import { HistoryPill } from "@/components/canvas/HistoryPill";
import { BoundingBox } from "@/components/canvas/BoundingBox";
import { SelectionBox } from "@/components/canvas/SelectionBox";
import { SaveIndicator } from "@/components/canvas/SaveIndicator";
import {
  LayersSidebar,
  LayersSidebarToggle,
} from "@/components/canvas/LayersSidebar";
import { AISidebar, AISidebarToggle } from "@/components/canvas/AISidebar";
import { getShapeCenter } from "@/lib/canvas/layers-sidebar-utils";

// Import shape components
import { Frame } from "@/components/canvas/shapes/Frame";
import { Rectangle } from "@/components/canvas/shapes/Rectangle";
import { Ellipse } from "@/components/canvas/shapes/Ellipse";
import { Line } from "@/components/canvas/shapes/Line";
import { Arrow } from "@/components/canvas/shapes/Arrow";
import { Stroke } from "@/components/canvas/shapes/Stroke";
import { Text } from "@/components/canvas/shapes/Text";

// Import preview components
import { FramePreview } from "@/components/canvas/shapes/FramePreview";
import { RectanglePreview } from "@/components/canvas/shapes/RectanglePreview";
import { EllipsePreview } from "@/components/canvas/shapes/EllipsePreview";
import { LinePreview } from "@/components/canvas/shapes/LinePreview";
import { ArrowPreview } from "@/components/canvas/shapes/ArrowPreview";
import { FreeDrawStrokePreview } from "@/components/canvas/shapes/StrokePreview";
import { ShapePropertiesBar } from "@/components/canvas/ShapePropertiesBar";
import {
  strokeWidthToPixels,
  cornerTypeToRadius,
  fontFamilyPresetToCSS,
  type StrokeWidthPreset,
  type CornerType,
  type FontFamilyPreset,
  type TextAlignOption,
} from "@/lib/canvas/properties-utils";
import { TooltipProvider } from "@/components/ui/tooltip";

function CanvasContent({ projectId }: { projectId: string }) {
  // Autosave hook
  const { saveStatus, lastSavedAt, isLoading } = useAutosave(projectId);
  const {
    viewport,
    shapes,
    activeTool,
    selectedShapes,
    canUndo,
    canRedo,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onDoubleClick,
    attachCanvasRef,
    selectTool,
    getDraftShape,
    getFreeDrawPoints,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomToFit,
    getSelectionBox,
    undo,
    redo,
  } = useInfiniteCanvas();

  const {
    dispatchViewport,
    dispatchShapes,
    defaultProperties,
    setDefaultProperty,
  } = useCanvasContext();
  const { cursorClass } = useCanvasCursor();

  // Get selected shapes as array
  const selectedShapesList = shapes.filter((s) => selectedShapes[s.id]);

  // Handle property change for selected shapes
  const handlePropertyChange = useCallback(
    (property: string, value: unknown) => {
      const selectedIds = Object.keys(selectedShapes);
      if (selectedIds.length === 0) return;

      selectedIds.forEach((id) => {
        const shape = shapes.find((s) => s.id === id);
        if (!shape) return;

        let patch: Record<string, unknown> = {};

        switch (property) {
          case "strokeType":
            if (
              ["rect", "ellipse", "line", "arrow", "freedraw"].includes(
                shape.type
              )
            ) {
              patch.strokeType = value;
            }
            break;
          case "strokeWidth":
            if (["rect", "ellipse"].includes(shape.type)) {
              patch.strokeWidth = strokeWidthToPixels(
                value as StrokeWidthPreset
              );
            }
            break;
          case "strokeColor":
            if (
              ["rect", "ellipse", "line", "arrow", "freedraw"].includes(
                shape.type
              )
            ) {
              patch.stroke = value;
            }
            break;
          case "cornerType":
            if (shape.type === "rect") {
              patch.borderRadius = cornerTypeToRadius(value as CornerType);
            }
            break;
          case "fontFamily":
            if (shape.type === "text") {
              patch.fontFamily = fontFamilyPresetToCSS(
                value as FontFamilyPreset
              );
            }
            break;
          case "textAlign":
            if (shape.type === "text") {
              patch.textAlign = value as TextAlignOption;
            }
            break;
          case "textColor":
            if (shape.type === "text") {
              patch.stroke = value;
            }
            break;
          case "frameFill":
            if (shape.type === "frame") {
              patch.fill = value;
            }
            break;
          case "frameCornerType":
            if (shape.type === "frame") {
              patch.borderRadius = cornerTypeToRadius(value as CornerType);
            }
            break;
          case "width":
            if (["frame", "rect", "ellipse"].includes(shape.type)) {
              patch.w = value;
            }
            break;
          case "height":
            if (["frame", "rect", "ellipse"].includes(shape.type)) {
              patch.h = value;
            }
            break;
        }

        if (Object.keys(patch).length > 0) {
          dispatchShapes({
            type: "UPDATE_SHAPE",
            payload: { id, patch },
          });
        }
      });
    },
    [selectedShapes, shapes, dispatchShapes]
  );

  // Handle default property change
  const handleDefaultChange = useCallback(
    (property: string, value: unknown) => {
      setDefaultProperty(property, value);
    },
    [setDefaultProperty]
  );

  // Sidebar states
  const [isLayersSidebarOpen, setIsLayersSidebarOpen] = useState(true);
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);

  // Handle shape click from sidebar - center viewport and select shape
  const handleSidebarShapeClick = useCallback(
    (shapeId: string) => {
      const shape = shapes.find((s) => s.id === shapeId);
      if (!shape) return;

      // Calculate shape center
      const center = getShapeCenter(shape);

      // Get viewport dimensions (use window as fallback)
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Center the viewport on the shape
      dispatchViewport({
        type: "CENTER_ON_WORLD",
        payload: {
          world: center,
          toScreen: { x: viewportWidth / 2, y: viewportHeight / 2 },
        },
      });

      // Select the shape
      dispatchShapes({ type: "CLEAR_SELECTION" });
      dispatchShapes({ type: "SELECT_SHAPE", payload: shapeId });
    },
    [shapes, dispatchViewport, dispatchShapes]
  );

  const draftShape = getDraftShape();
  const freeDrawPoints = getFreeDrawPoints();
  const selectionBox = getSelectionBox();

  // Show loading state while initial data is being fetched
  if (isLoading) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-accent flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Loading canvas...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-accent"
      style={{ overscrollBehavior: "none" }}
    >
      {/* AI Sidebar */}
      <AISidebar
        isOpen={isAISidebarOpen}
        onClose={() => setIsAISidebarOpen(false)}
      />

      {/* Toolbar */}
      <Toolbar currentTool={activeTool} onToolSelect={selectTool} />

      {/* Zoom Bar */}
      <ZoomBar
        scale={viewport.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetZoom}
        onZoomToFit={zoomToFit}
        minScale={viewport.minScale}
        maxScale={viewport.maxScale}
      />

      {/* History Pill */}
      <HistoryPill
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Layers Sidebar */}
      <LayersSidebar
        shapes={shapes}
        selectedShapes={selectedShapes}
        onShapeClick={handleSidebarShapeClick}
        onReorderShape={(shapeId, newIndex) => {
          dispatchShapes({
            type: "REORDER_SHAPE",
            payload: { shapeId, newIndex },
          });
        }}
        isOpen={isLayersSidebarOpen}
      />

      {/* Back to Dashboard + AI Toggle + Properties Bar */}
      <div className="absolute top-3 left-3 z-50 flex items-center gap-2">
        <BackButton />
        <AISidebarToggle
          isOpen={isAISidebarOpen}
          onToggle={() => setIsAISidebarOpen(!isAISidebarOpen)}
        />
        <ShapePropertiesBar
          currentTool={activeTool}
          selectedShapes={selectedShapesList}
          defaultProperties={defaultProperties}
          onPropertyChange={handlePropertyChange}
          onDefaultChange={handleDefaultChange}
        />
      </div>

      {/* Top Right Actions */}
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
        <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
        <CanvasActions />
        <LayersSidebarToggle
          isOpen={isLayersSidebarOpen}
          onToggle={() => setIsLayersSidebarOpen(!isLayersSidebarOpen)}
        />
      </div>

      {/* Canvas - Outer container for event handling */}
      <div
        ref={attachCanvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onDoubleClick={onDoubleClick}
        className={`h-full w-full ${cursorClass} relative overflow-hidden`}
        style={{
          touchAction: "none",
          overscrollBehavior: "none",
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
              return <Ellipse key={shape.id} shape={shape} />;
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
                <EllipsePreview
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
                showEdgeHandles={shape.type !== "text"}
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

interface CanvasPageProps {
  params: Promise<{ projectId: string }>;
}

export default function CanvasPage({ params }: CanvasPageProps) {
  const { projectId } = use(params);

  return (
    <CanvasProvider>
      <TooltipProvider delayDuration={300}>
        <CanvasContent projectId={projectId} />
      </TooltipProvider>
    </CanvasProvider>
  );
}
