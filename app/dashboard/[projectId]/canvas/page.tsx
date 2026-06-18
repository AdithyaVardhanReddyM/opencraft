"use client";

import { use, useState, useCallback, useEffect } from "react";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SCREEN_DEFAULTS } from "@/lib/canvas/shape-factories";
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
import { AISidebar } from "@/components/canvas/AISidebar";
import { DEFAULT_MODEL_ID } from "@/lib/ai-models";
import { getShapeCenter } from "@/lib/canvas/layers-sidebar-utils";
import { getFramesWithContainedShapes } from "@/lib/canvas/containment-utils";
import { captureFrameAsImage } from "@/lib/canvas/canvas-capture";
import { GenerateButton } from "@/components/canvas/GenerateButton";
import { toast } from "sonner";
import type { FrameShape } from "@/types/canvas";

// Import shape components
import { Frame } from "@/components/canvas/shapes/Frame";
import { Rectangle } from "@/components/canvas/shapes/Rectangle";
import { Ellipse } from "@/components/canvas/shapes/Ellipse";
import { Line } from "@/components/canvas/shapes/Line";
import { Arrow } from "@/components/canvas/shapes/Arrow";
import { Stroke } from "@/components/canvas/shapes/Stroke";
import { Text } from "@/components/canvas/shapes/Text";
import { Screen } from "@/components/canvas/shapes/Screen";
import { DeleteScreenModal } from "@/components/canvas/DeleteScreenModal";
import { ScreenToolbar } from "@/components/canvas/ScreenToolbar";
import type { ScreenShape, Shape } from "@/types/canvas";

// Import preview components
import { FramePreview } from "@/components/canvas/shapes/FramePreview";
import { RectanglePreview } from "@/components/canvas/shapes/RectanglePreview";
import { EllipsePreview } from "@/components/canvas/shapes/EllipsePreview";
import { LinePreview } from "@/components/canvas/shapes/LinePreview";
import { ArrowPreview } from "@/components/canvas/shapes/ArrowPreview";
import { FreeDrawStrokePreview } from "@/components/canvas/shapes/StrokePreview";
import { ScreenCursorPreview } from "@/components/canvas/shapes/ScreenCursorPreview";
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
import { resolveBoundArrow } from "@/lib/canvas/arrow-utils";
import { joinSandboxUrl } from "@/lib/sandbox-url";

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
    getMouseWorldPosition,
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

  // Lookup of shape id -> shape, used to resolve bound flow connectors at render.
  const shapesById = new Map(shapes.map((s) => [s.id, s]));

  // Handle property change for selected shapes
  const handlePropertyChange = useCallback(
    (property: string, value: unknown) => {
      const selectedIds = Object.keys(selectedShapes);
      if (selectedIds.length === 0) return;

      selectedIds.forEach((id) => {
        const shape = shapes.find((s) => s.id === id);
        if (!shape) return;

        const patch: Record<string, unknown> = {};

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
          case "arrowType":
            if (shape.type === "arrow") {
              patch.arrowType = value;
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
            if (["frame", "rect", "ellipse", "screen"].includes(shape.type)) {
              patch.w = value;
            }
            break;
          case "height":
            if (["frame", "rect", "ellipse", "screen"].includes(shape.type)) {
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

  // True while the agent is generating code for the currently-selected screen.
  // Drives the animated border beam on that screen shape.
  const [isSelectedScreenGenerating, setIsSelectedScreenGenerating] =
    useState(false);

  // Delete screen modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [screenToDelete, setScreenToDelete] = useState<{
    shapeId: string;
    screenId: Id<"screens"> | null;
    title?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Generation context for frame-to-AI workflow
  const [generationContext, setGenerationContext] = useState<{
    image: Blob;
    sourceFrameId: string;
  } | null>(null);

  // A flow prompt queued to auto-send once the newly created child screen is
  // selected. Keyed by the child's shape id so it only fires for that screen.
  const [pendingFlowPrompt, setPendingFlowPrompt] = useState<{
    shapeId: string;
    prompt: string;
  } | null>(null);

  // Convex mutations and queries
  const deleteScreenMutation = useMutation(api.screens.deleteScreen);
  const createScreenMutation = useMutation(api.screens.createScreen);
  const createFlowScreenMutation = useMutation(api.screens.createFlowScreen);

  // Wait for Convex auth before querying so a direct load/refresh right after
  // sign-in doesn't throw "Not authenticated" before the token reaches Convex.
  const { isAuthenticated } = useConvexAuth();

  // Query all screens for this project to get their data (sandboxUrl, title, etc.)
  const screensData = useQuery(
    api.screens.getScreensByProject,
    isAuthenticated ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  // Map of Convex screen _id -> screen doc, used to resolve a flow child's parent.
  const screensById = new Map((screensData ?? []).map((s) => [s._id, s]));

  // Create a map of shapeId -> screen data for quick lookup.
  // Flow children share their parent's sandbox and display a different route; their
  // iframe URL is resolved from the parent's current base + the child's route so it
  // survives sandbox resume (host changes). `route` is also passed through so the
  // resume hook can re-append it after a resume.
  const screenDataMap = new Map(
    (screensData ?? []).map((screen) => {
      let sandboxUrl = screen.sandboxUrl;
      if (screen.parentScreenId) {
        const parent = screensById.get(screen.parentScreenId);
        const base = screen.sandboxUrl ?? parent?.sandboxUrl;
        sandboxUrl = joinSandboxUrl(base, screen.route) ?? base;
      }
      return [
        screen.shapeId,
        {
          _id: screen._id,
          sandboxUrl,
          sandboxId: screen.sandboxId,
          title: screen.title,
          theme: screen.theme,
          parentScreenId: screen.parentScreenId,
          route: screen.route,
        },
      ];
    })
  );

  // AI Sidebar opens when a screen is selected
  const selectedScreenShape = selectedShapesList.find(
    (s) => s.type === "screen"
  );
  const selectedScreenId = selectedScreenShape
    ? screenDataMap.get(selectedScreenShape.id)?._id
    : undefined;
  const isAISidebarOpen = !!selectedScreenShape;

  // Handle screen tool click - create screen in Convex and add to canvas
  useEffect(() => {
    const handleScreenToolClick = async (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      const { x, y } = customEvent.detail;

      // Center the screen shape on the click position
      const centeredX = x - SCREEN_DEFAULTS.width / 2;
      const centeredY = y - SCREEN_DEFAULTS.height / 2;

      try {
        // Generate a unique shape ID first using nanoid
        const { nanoid } = await import("nanoid");
        const shapeId = nanoid();

        // Create screen record in Convex with the shapeId
        const convexScreenId = await createScreenMutation({
          shapeId: shapeId,
          projectId: projectId as Id<"projects">,
        });

        // Add the screen shape to the canvas (centered on click position)
        // The shape factory will use the provided id instead of generating a new one
        dispatchShapes({
          type: "ADD_SCREEN",
          payload: {
            x: centeredX,
            y: centeredY,
            w: SCREEN_DEFAULTS.width,
            h: SCREEN_DEFAULTS.height,
            screenId: convexScreenId, // Convex document ID for linking
            id: shapeId, // Use the same shapeId we registered in Convex
          },
        });

        // Select the new screen shape - this will automatically open the AI sidebar
        dispatchShapes({ type: "SELECT_SHAPE", payload: shapeId });

        pendo.track("screen_created", {
          project_id: projectId,
          screen_id: String(convexScreenId),
          creation_method: "screen_tool",
        });
      } catch (error) {
        console.error("Failed to create screen:", error);
      }
    };

    window.addEventListener("screen-tool-click", handleScreenToolClick);
    return () =>
      window.removeEventListener("screen-tool-click", handleScreenToolClick);
  }, [createScreenMutation, projectId, dispatchShapes]);

  // Handle delete key for screen shapes - show confirmation modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === "INPUT" || target.tagName === "TEXTAREA";
        if (isInput) return;

        // Check if any selected shape is a screen
        const selectedIds = Object.keys(selectedShapes);
        const selectedScreens = selectedIds
          .map((id) => shapes.find((s) => s.id === id))
          .filter((s) => s?.type === "screen");

        if (selectedScreens.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          const screenShape = selectedScreens[0];
          if (screenShape && screenShape.type === "screen") {
            // Get the Convex screen ID from the screen data map
            const screenData = screenDataMap.get(screenShape.id);
            setScreenToDelete({
              shapeId: screenShape.id,
              screenId: screenData?._id ?? null,
              title: screenData?.title || "Screen",
            });
            setDeleteModalOpen(true);
          }
        }
      }
    };

    // Use capture phase to intercept before the canvas hook
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [selectedShapes, shapes, screenDataMap]);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!screenToDelete) return;

    setIsDeleting(true);
    try {
      // Remove any flow connectors bound to this screen so dangling arrows don't
      // linger after the screen is gone.
      shapes
        .filter(
          (s) =>
            s.type === "arrow" &&
            (s.startBinding?.shapeId === screenToDelete.shapeId ||
              s.endBinding?.shapeId === screenToDelete.shapeId)
        )
        .forEach((arrow) =>
          dispatchShapes({ type: "REMOVE_SHAPE", payload: arrow.id })
        );

      // Delete from canvas
      dispatchShapes({ type: "REMOVE_SHAPE", payload: screenToDelete.shapeId });

      // Delete from Convex if we have a screenId
      if (screenToDelete.screenId) {
        await deleteScreenMutation({ screenId: screenToDelete.screenId });
      }

      pendo.track("screen_deleted", {
        screen_id: screenToDelete.screenId ? String(screenToDelete.screenId) : "",
        project_id: projectId,
        screen_title: screenToDelete.title || "",
      });
    } catch (error) {
      console.error("Failed to delete screen:", error);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setScreenToDelete(null);
    }
  }, [screenToDelete, dispatchShapes, deleteScreenMutation, shapes, projectId]);

  // Handle screen toolbar delete - opens the delete modal
  const handleToolbarDelete = useCallback(() => {
    if (!selectedScreenShape) return;
    const screenData = screenDataMap.get(selectedScreenShape.id);
    setScreenToDelete({
      shapeId: selectedScreenShape.id,
      screenId: screenData?._id ?? null,
      title: screenData?.title || "Screen",
    });
    setDeleteModalOpen(true);
  }, [selectedScreenShape, screenDataMap]);

  // Handle screen toolbar resize
  const handleToolbarResize = useCallback(
    (width: number, height: number) => {
      if (!selectedScreenShape) return;
      dispatchShapes({
        type: "UPDATE_SHAPE",
        payload: {
          id: selectedScreenShape.id,
          patch: { w: width, h: height },
        },
      });
    },
    [selectedScreenShape, dispatchShapes]
  );

  // Handle screen toolbar refresh - dispatch custom event to refresh iframe
  const handleToolbarRefresh = useCallback(() => {
    if (!selectedScreenShape) return;
    window.dispatchEvent(
      new CustomEvent("screen-refresh", {
        detail: { shapeId: selectedScreenShape.id },
      })
    );
  }, [selectedScreenShape]);

  // Handle "Create flow" - spin up a child screen that shares this screen's
  // sandbox, connect it with a bound elbow arrow, and queue the prompt to build a
  // new page (route) in the same app.
  const handleCreateFlow = useCallback(
    async (prompt: string) => {
      if (!selectedScreenShape || selectedScreenShape.type !== "screen") return;
      const parentShape = selectedScreenShape as ScreenShape;
      const parentScreenId = screensData?.find(
        (s) => s.shapeId === parentShape.id
      )?._id;
      if (!parentScreenId) return;

      try {
        const { nanoid } = await import("nanoid");
        const childShapeId = nanoid();

        const childScreenId = await createFlowScreenMutation({
          shapeId: childShapeId,
          projectId: projectId as Id<"projects">,
          parentScreenId,
        });

        // Position the child below and slightly right of the parent.
        const childX = parentShape.x + parentShape.w / 2 + 80;
        const childY = parentShape.y + parentShape.h + 160;

        dispatchShapes({
          type: "ADD_SCREEN",
          payload: {
            x: childX,
            y: childY,
            w: SCREEN_DEFAULTS.width,
            h: SCREEN_DEFAULTS.height,
            screenId: childScreenId,
            id: childShapeId,
          },
        });

        // Bound elbow connector parent -> child. Endpoints are recomputed at render
        // from the shapes' live geometry, so these initial values are just a seed.
        dispatchShapes({
          type: "ADD_ARROW",
          payload: {
            startX: parentShape.x + parentShape.w / 2,
            startY: parentShape.y + parentShape.h,
            endX: childX + SCREEN_DEFAULTS.width / 2,
            endY: childY,
            stroke: "#94a3b8",
            strokeWidth: 2,
            arrowType: "elbow",
            startBinding: { shapeId: parentShape.id },
            endBinding: { shapeId: childShapeId },
          },
        });

        // Select the child (opens the AI sidebar) and queue the prompt to auto-send.
        dispatchShapes({ type: "CLEAR_SELECTION" });
        dispatchShapes({ type: "SELECT_SHAPE", payload: childShapeId });
        setPendingFlowPrompt({ shapeId: childShapeId, prompt });

        pendo.track("flow_screen_created", {
          project_id: projectId,
          parent_screen_id: String(parentScreenId),
          child_screen_id: String(childScreenId),
        });
      } catch (error) {
        console.error("Failed to create flow:", error);
        toast.error("Failed to create flow");
      }
    },
    [
      selectedScreenShape,
      screensData,
      createFlowScreenMutation,
      projectId,
      dispatchShapes,
    ]
  );

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false);
    setScreenToDelete(null);
  }, []);

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

  // Get frames with contained shapes for GenerateButton rendering
  const framesWithShapes = getFramesWithContainedShapes(shapes);

  // Handle frame generation - capture frame and create screen
  const handleFrameGenerate = useCallback(
    async (frame: FrameShape, containedShapes: Shape[]) => {
      try {
        // Capture frame contents as image
        const captureResult = await captureFrameAsImage(frame, containedShapes);

        // Generate a unique shape ID for the screen
        const { nanoid } = await import("nanoid");
        const shapeId = nanoid();

        // Create screen record in Convex
        const convexScreenId = await createScreenMutation({
          shapeId: shapeId,
          projectId: projectId as Id<"projects">,
        });

        // Position screen to the right of the frame with 50px gap
        const screenX = frame.x + frame.w + 50;
        const screenY = frame.y;

        // Add the screen shape to the canvas
        dispatchShapes({
          type: "ADD_SCREEN",
          payload: {
            x: screenX,
            y: screenY,
            w: SCREEN_DEFAULTS.width,
            h: SCREEN_DEFAULTS.height,
            screenId: convexScreenId,
            id: shapeId,
          },
        });

        // Select the new screen shape (opens AI sidebar)
        dispatchShapes({ type: "CLEAR_SELECTION" });
        dispatchShapes({ type: "SELECT_SHAPE", payload: shapeId });

        // Store generation context for AI sidebar
        setGenerationContext({
          image: captureResult.blob,
          sourceFrameId: frame.id,
        });

        pendo.track("frame_to_design_generated", {
          project_id: projectId,
          source_frame_id: frame.id,
          contained_shapes_count: containedShapes.length,
          frame_width: frame.w,
          frame_height: frame.h,
        });
      } catch (error) {
        console.error("Failed to generate from frame:", error);
        if (error instanceof Error) {
          if (
            error.message.includes("canvas") ||
            error.message.includes("blob")
          ) {
            toast.error("Failed to capture frame contents");
          } else if (
            error.message.includes("Convex") ||
            error.message.includes("screen")
          ) {
            toast.error("Failed to create screen");
          } else {
            toast.error("Failed to generate from frame");
          }
        } else {
          toast.error("Failed to generate from frame");
        }
      }
    },
    [createScreenMutation, projectId, dispatchShapes]
  );

  const draftShape = getDraftShape();
  const freeDrawPoints = getFreeDrawPoints();
  const selectionBox = getSelectionBox();

  // Show loading state while initial data is being fetched
  if (isLoading) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-canvas flex items-center justify-center">
        <Shimmer className="text-sm" duration={1.5} spread={3}>
          Loading canvas...
        </Shimmer>
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-canvas"
      style={{ overscrollBehavior: "none" }}
    >
      {/* Delete Screen Confirmation Modal */}
      <DeleteScreenModal
        isOpen={deleteModalOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        screenTitle={screenToDelete?.title}
        isDeleting={isDeleting}
      />

      {/* AI Sidebar - opens when a screen is selected */}
      <AISidebar
        isOpen={isAISidebarOpen}
        onClose={() => {
          // Deselect the screen to close the sidebar
          if (selectedScreenShape) {
            dispatchShapes({ type: "CLEAR_SELECTION" });
          }
        }}
        selectedScreenId={selectedScreenId}
        projectId={projectId}
        sandboxId={
          selectedScreenShape
            ? screenDataMap.get(selectedScreenShape.id)?.sandboxId
            : undefined
        }
        sandboxUrl={
          selectedScreenShape
            ? screenDataMap.get(selectedScreenShape.id)?.sandboxUrl
            : undefined
        }
        cachedFiles={
          selectedScreenShape
            ? (screensData?.find((s) => s.shapeId === selectedScreenShape.id)
                ?.files as Record<string, string> | undefined)
            : undefined
        }
        initialImage={generationContext?.image}
        initialPrompt={
          generationContext
            ? "Generate a full blown professional/modern web page/component based on this user's sketch/wireframe"
            : undefined
        }
        initialModelId={generationContext ? DEFAULT_MODEL_ID : undefined}
        onInitialDataConsumed={() => setGenerationContext(null)}
        onGeneratingChange={setIsSelectedScreenGenerating}
        autoSendPrompt={
          pendingFlowPrompt &&
          selectedScreenShape?.id === pendingFlowPrompt.shapeId
            ? pendingFlowPrompt.prompt
            : undefined
        }
        onAutoSendConsumed={() => setPendingFlowPrompt(null)}
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
        screenDataMap={screenDataMap}
      />

      {/* Back to Dashboard + Properties Bar */}
      <div className="absolute top-3 left-3 z-50 flex items-center gap-2">
        <BackButton />
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
              // Flow connectors carry bindings; resolve their endpoints from the
              // connected shapes' live geometry so they follow on move/resize.
              return (
                <Arrow
                  key={shape.id}
                  shape={resolveBoundArrow(shape, shapesById)}
                />
              );
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
            if (shape.type === "screen") {
              const isSelected = !!selectedShapes[shape.id];
              // Get screen data from Convex (sandboxUrl, title) for iframe rendering
              const screenData = screenDataMap.get(shape.id);
              return (
                <Screen
                  key={shape.id}
                  shape={shape}
                  isSelected={isSelected}
                  isGenerating={isSelected && isSelectedScreenGenerating}
                  screenData={screenData}
                  onClick={() => {
                    dispatchShapes({ type: "CLEAR_SELECTION" });
                    dispatchShapes({ type: "SELECT_SHAPE", payload: shape.id });
                    // AI sidebar opens automatically when screen is selected
                  }}
                />
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
                  arrowType={defaultProperties.arrowType}
                />
              )}
            </>
          )}

          {/* Render freedraw preview */}
          {freeDrawPoints.length > 0 && (
            <FreeDrawStrokePreview points={freeDrawPoints} />
          )}

          {/* Render screen cursor preview when screen tool is active */}
          {activeTool === "screen" && (
            <ScreenCursorPreview
              worldX={getMouseWorldPosition().x}
              worldY={getMouseWorldPosition().y}
            />
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

          {/* Screen Toolbar - appears above selected screen shapes (inside transform container) */}
          {selectedScreenShape && selectedScreenShape.type === "screen" && (
            <ScreenToolbar
              shape={selectedScreenShape as ScreenShape}
              screenData={screenDataMap.get(selectedScreenShape.id)}
              viewport={viewport}
              isGenerating={isSelectedScreenGenerating}
              onDelete={handleToolbarDelete}
              onResize={handleToolbarResize}
              onRefresh={handleToolbarRefresh}
              onCreateFlow={handleCreateFlow}
            />
          )}
        </div>
      </div>

      {/* Generate buttons for frames with contained shapes - outside canvas container */}
      {framesWithShapes.map(({ frame, containedShapes }) => (
        <GenerateButton
          key={`generate-${frame.id}`}
          frame={frame}
          containedShapes={containedShapes}
          viewport={viewport}
          onGenerate={handleFrameGenerate}
        />
      ))}
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
