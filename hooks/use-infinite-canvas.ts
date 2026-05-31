"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useCanvasContext } from "@/contexts/CanvasContext";
import type {
  Point,
  Tool,
  ViewportState,
  Shape,
  SelectionMap,
  DraftShape,
  TouchPointer,
  ResizeData,
} from "@/types/canvas";
import { screenToWorld } from "@/lib/canvas/coordinate-utils";
import { getShapeAtPoint } from "@/lib/canvas/hit-testing";
import { getTextShapeDimensions } from "@/lib/canvas/text-utils";

const RAF_INTERVAL_MS = 8;

const TOOL_HOTKEYS: Record<string, Tool> = {
  s: "select",
  h: "hand",
  f: "frame",
  r: "rect",
  c: "ellipse",
  l: "line",
  a: "arrow",
  d: "freedraw",
  t: "text",
  e: "eraser",
};

export interface UseInfiniteCanvasReturn {
  // State
  viewport: ViewportState;
  shapes: Shape[];
  currentTool: Tool;
  activeTool: Tool;
  selectedShapes: SelectionMap;
  isSidebarOpen: boolean;
  hasSelectedText: boolean;

  // Event Handlers
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onPointerCancel: React.PointerEventHandler<HTMLDivElement>;
  onDoubleClick: React.MouseEventHandler<HTMLDivElement>;

  // Utilities
  attachCanvasRef: (ref: HTMLDivElement | null) => void;
  selectTool: (tool: Tool) => void;
  getDraftShape: () => DraftShape | null;
  getFreeDrawPoints: () => readonly Point[];
  setIsSidebarOpen: (open: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  getSelectionBox: () => { start: Point; current: Point } | null;
}

export function useInfiniteCanvas(): UseInfiniteCanvasReturn {
  // Get context
  const {
    viewport,
    dispatchViewport,
    shapes: shapesState,
    dispatchShapes,
    shapesList,
  } = useCanvasContext();

  // Local state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [, forceUpdate] = useState(0);
  const [isHandOverride, setIsHandOverride] = useState(false);

  // Refs for DOM and interaction state
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const touchMapRef = useRef<Map<number, TouchPointer>>(new Map());
  const draftShapeRef = useRef<DraftShape | null>(null);
  const freeDrawPointsRef = useRef<Point[]>([]);
  const isSpacePressed = useRef(false);

  // Interaction flags
  const isDrawingRef = useRef(false);
  const isMovingRef = useRef(false);
  const isErasingRef = useRef(false);
  const isResizingRef = useRef(false);
  const isSelectingRef = useRef(false);

  // Selection box tracking
  const selectionBoxRef = useRef<{ start: Point; current: Point } | null>(null);

  // Movement tracking
  const moveStartRef = useRef<Point | null>(null);
  const initialShapePositionsRef = useRef<
    Record<
      string,
      {
        x?: number;
        y?: number;
        points?: Point[];
        startX?: number;
        startY?: number;
        endX?: number;
        endY?: number;
      }
    >
  >({});

  // Eraser tracking
  const erasedShapesRef = useRef<Set<string>>(new Set());

  // Resize tracking
  const resizeDataRef = useRef<ResizeData | null>(null);

  // RAF optimization refs
  const lastFreehandFrameRef = useRef(0);
  const freehandRafRef = useRef<number | null>(null);
  const panRafRef = useRef<number | null>(null);
  const pendingPanPointRef = useRef<Point | null>(null);

  // Computed values
  const currentTool = shapesState.tool;
  const selectedShapes = shapesState.selected;
  const activeTool = isHandOverride ? "hand" : currentTool;

  const hasSelectedText = Object.keys(selectedShapes).some((id) => {
    const shape = shapesState.shapes.entities[id];
    return shape?.type === "text";
  });

  // Auto-open sidebar for text selection
  useEffect(() => {
    if (hasSelectedText && !isSidebarOpen) {
      setIsSidebarOpen(true);
    } else if (!hasSelectedText) {
      setIsSidebarOpen(false);
    }
  }, [hasSelectedText, isSidebarOpen]);

  // Keyboard event handlers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement;
      const isTypingElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (
        (e.code === "Space" || e.key === " ") &&
        !e.repeat &&
        !isTypingElement
      ) {
        e.preventDefault();
        if (!isSpacePressed.current) {
          isSpacePressed.current = true;
          setIsHandOverride(true);
          dispatchViewport({ type: "HAND_TOOL_ENABLE" });
        }
        return;
      }

      if (!isTypingElement) {
        const key = e.key.toLowerCase();
        const mappedTool = TOOL_HOTKEYS[key];
        if (mappedTool) {
          e.preventDefault();
          dispatchShapes({ type: "SET_TOOL", payload: mappedTool });
          return;
        }
      }

      // Delete/Backspace handling
      if (e.key === "Delete" || e.key === "Backspace") {
        const isInput =
          target.tagName === "INPUT" || target.tagName === "TEXTAREA";

        if (!isInput && Object.keys(selectedShapes).length > 0) {
          e.preventDefault();
          dispatchShapes({ type: "DELETE_SELECTED" });
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement;
      const isTypingElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (
        (e.code === "Space" || e.key === " ") &&
        !e.repeat &&
        !isTypingElement
      ) {
        e.preventDefault();
        if (isSpacePressed.current) {
          isSpacePressed.current = false;
          setIsHandOverride(false);
          dispatchViewport({ type: "HAND_TOOL_DISABLE" });
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      if (freehandRafRef.current) {
        window.cancelAnimationFrame(freehandRafRef.current);
      }
      if (panRafRef.current) {
        window.cancelAnimationFrame(panRafRef.current);
      }
    };
  }, [dispatchViewport, selectedShapes, dispatchShapes]);

  // Resize event handlers
  useEffect(() => {
    const handleResizeStart = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { shapeId, corner, bounds } = customEvent.detail;
      isResizingRef.current = true;
      resizeDataRef.current = {
        shapeId,
        corner,
        initialBounds: bounds,
        startPoint: {
          x: customEvent.detail.clientX || 0,
          y: customEvent.detail.clientY || 0,
        },
      };
    };

    const handleResizeMove = (e: Event) => {
      if (!isResizingRef.current || !resizeDataRef.current) return;

      const customEvent = e as CustomEvent;
      const { shapeId, corner: handle, initialBounds } = resizeDataRef.current;
      const { clientX, clientY } = customEvent.detail;

      const canvasEl = canvasRef.current;
      if (!canvasEl) return;

      const rect = canvasEl.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const world = screenToWorld(
        { x: localX, y: localY },
        viewport.translate,
        viewport.scale
      );

      const shape = shapesState.shapes.entities[shapeId];
      if (!shape) return;

      if (
        (shape.type === "arrow" || shape.type === "line") &&
        (handle === "line-start" || handle === "line-end")
      ) {
        const patch =
          handle === "line-start"
            ? { startX: world.x, startY: world.y }
            : { endX: world.x, endY: world.y };

        dispatchShapes({
          type: "UPDATE_SHAPE",
          payload: {
            id: shapeId,
            patch,
          },
        });
        return;
      }

      const newBounds = { ...initialBounds };

      switch (handle) {
        case "nw":
          newBounds.w = Math.max(
            10,
            initialBounds.w + (initialBounds.x - world.x)
          );
          newBounds.h = Math.max(
            10,
            initialBounds.h + (initialBounds.y - world.y)
          );
          newBounds.x = world.x;
          newBounds.y = world.y;
          break;
        case "ne":
          newBounds.w = Math.max(10, world.x - initialBounds.x);
          newBounds.h = Math.max(
            10,
            initialBounds.h + (initialBounds.y - world.y)
          );
          newBounds.y = world.y;
          break;
        case "sw":
          newBounds.w = Math.max(
            10,
            initialBounds.w + (initialBounds.x - world.x)
          );
          newBounds.h = Math.max(10, world.y - initialBounds.y);
          newBounds.x = world.x;
          break;
        case "se":
          newBounds.w = Math.max(10, world.x - initialBounds.x);
          newBounds.h = Math.max(10, world.y - initialBounds.y);
          break;
        case "n":
          newBounds.h = Math.max(
            10,
            initialBounds.h + (initialBounds.y - world.y)
          );
          newBounds.y = world.y;
          break;
        case "s":
          newBounds.h = Math.max(10, world.y - initialBounds.y);
          break;
        case "w":
          newBounds.w = Math.max(
            10,
            initialBounds.w + (initialBounds.x - world.x)
          );
          newBounds.x = world.x;
          break;
        case "e":
          newBounds.w = Math.max(10, world.x - initialBounds.x);
          break;
      }

      if (
        shape.type === "frame" ||
        shape.type === "rect" ||
        shape.type === "ellipse" ||
        shape.type === "generatedui"
      ) {
        dispatchShapes({
          type: "UPDATE_SHAPE",
          payload: {
            id: shapeId,
            patch: {
              x: newBounds.x,
              y: newBounds.y,
              w: newBounds.w,
              h: newBounds.h,
            },
          },
        });
      } else if (shape.type === "freedraw") {
        const xs = shape.points.map((p) => p.x);
        const ys = shape.points.map((p) => p.y);

        const actualMinX = Math.min(...xs);
        const actualMaxX = Math.max(...xs);
        const actualMinY = Math.min(...ys);
        const actualMaxY = Math.max(...ys);
        const actualWidth = actualMaxX - actualMinX;
        const actualHeight = actualMaxY - actualMinY;

        const newActualX = newBounds.x + 5;
        const newActualY = newBounds.y + 5;
        const newActualWidth = Math.max(10, newBounds.w - 10);
        const newActualHeight = Math.max(10, newBounds.h - 10);

        const scaleX = actualWidth > 0 ? newActualWidth / actualWidth : 1;
        const scaleY = actualHeight > 0 ? newActualHeight / actualHeight : 1;

        const scaledPoints = shape.points.map((point) => ({
          x: newActualX + (point.x - actualMinX) * scaleX,
          y: newActualY + (point.y - actualMinY) * scaleY,
        }));

        dispatchShapes({
          type: "UPDATE_SHAPE",
          payload: {
            id: shapeId,
            patch: {
              points: scaledPoints,
            },
          },
        });
      } else if (shape.type === "arrow" || shape.type === "line") {
        const actualMinX = Math.min(shape.startX, shape.endX);
        const actualMaxX = Math.max(shape.startX, shape.endX);
        const actualMinY = Math.min(shape.startY, shape.endY);
        const actualMaxY = Math.max(shape.startY, shape.endY);
        const actualWidth = actualMaxX - actualMinX;
        const actualHeight = actualMaxY - actualMinY;

        const newActualX = newBounds.x + 5;
        const newActualY = newBounds.y + 5;
        const newActualWidth = Math.max(10, newBounds.w - 10);
        const newActualHeight = Math.max(10, newBounds.h - 10);

        let newStartX: number,
          newStartY: number,
          newEndX: number,
          newEndY: number;

        if (actualWidth === 0) {
          // Vertical line
          newStartX = newActualX + newActualWidth / 2;
          newEndX = newActualX + newActualWidth / 2;
          newStartY =
            shape.startY < shape.endY
              ? newActualY
              : newActualY + newActualHeight;
          newEndY =
            shape.startY < shape.endY
              ? newActualY + newActualHeight
              : newActualY;
        } else if (actualHeight === 0) {
          // Horizontal line
          newStartY = newActualY + newActualHeight / 2;
          newEndY = newActualY + newActualHeight / 2;
          newStartX =
            shape.startX < shape.endX
              ? newActualX
              : newActualX + newActualWidth;
          newEndX =
            shape.startX < shape.endX
              ? newActualX + newActualWidth
              : newActualX;
        } else {
          // Diagonal line
          const scaleX = newActualWidth / actualWidth;
          const scaleY = newActualHeight / actualHeight;
          newStartX = newActualX + (shape.startX - actualMinX) * scaleX;
          newStartY = newActualY + (shape.startY - actualMinY) * scaleY;
          newEndX = newActualX + (shape.endX - actualMinX) * scaleX;
          newEndY = newActualY + (shape.endY - actualMinY) * scaleY;
        }

        dispatchShapes({
          type: "UPDATE_SHAPE",
          payload: {
            id: shapeId,
            patch: {
              startX: newStartX,
              startY: newStartY,
              endX: newEndX,
              endY: newEndY,
            },
          },
        });
      }
    };

    const handleResizeEnd = () => {
      isResizingRef.current = false;
      resizeDataRef.current = null;
    };

    window.addEventListener("shape-resize-start", handleResizeStart);
    window.addEventListener("shape-resize-move", handleResizeMove);
    window.addEventListener("shape-resize-end", handleResizeEnd);

    return () => {
      window.removeEventListener("shape-resize-start", handleResizeStart);
      window.removeEventListener("shape-resize-move", handleResizeMove);
      window.removeEventListener("shape-resize-end", handleResizeEnd);
    };
  }, [
    dispatchShapes,
    shapesState.shapes.entities,
    viewport.translate,
    viewport.scale,
  ]);

  // Coordinate conversion helpers
  const localPointFromClient = (clientX: number, clientY: number): Point => {
    const el = canvasRef.current;
    if (!el) return { x: clientX, y: clientY };
    const r = el.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  type WithClientXY = { clientX: number; clientY: number };
  const getLocalPointFromPtr = (e: WithClientXY): Point =>
    localPointFromClient(e.clientX, e.clientY);

  const isInteractiveTarget = (element: HTMLElement | null): boolean => {
    if (!element) return false;
    return (
      element.tagName === "BUTTON" ||
      element.closest("button") !== null ||
      element.classList.contains("pointer-events-auto") ||
      element.closest(".pointer-events-auto") !== null
    );
  };

  // Utility functions
  const blurActiveTextInput = () => {
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA")
    ) {
      (activeElement as HTMLElement).blur();
    }
  };

  const requestRender = (): void => {
    forceUpdate((n) => (n + 1) | 0);
  };

  const schedulePanMove = (p: Point) => {
    pendingPanPointRef.current = p;
    if (panRafRef.current != null) return;
    panRafRef.current = window.requestAnimationFrame(() => {
      panRafRef.current = null;
      const next = pendingPanPointRef.current;
      if (next) dispatchViewport({ type: "PAN_MOVE", payload: next });
    });
  };

  const freehandTick = (): void => {
    const now = performance.now();
    if (now - lastFreehandFrameRef.current >= RAF_INTERVAL_MS) {
      if (freeDrawPointsRef.current.length > 0) requestRender();
      lastFreehandFrameRef.current = now;
    }
    if (isDrawingRef.current) {
      freehandRafRef.current = window.requestAnimationFrame(freehandTick);
    }
  };

  // Pointer event handlers
  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;
    const isButton = isInteractiveTarget(target);

    // Allow interaction with text area when editing
    if (target.tagName === "TEXTAREA") {
      return;
    }

    if (!isButton) {
      e.preventDefault();
    } else {
      return; // Don't handle canvas interactions when clicking buttons
    }

    const local = getLocalPointFromPtr(e.nativeEvent);
    const world = screenToWorld(local, viewport.translate, viewport.scale);

    if (touchMapRef.current.size <= 1) {
      canvasRef.current?.setPointerCapture?.(e.pointerId);

      const isPanButton = e.button === 1 || e.button === 2;
      const panBySpace = isSpacePressed.current && e.button === 0;

      if (isPanButton || panBySpace) {
        const mode = isSpacePressed.current ? "shiftPanning" : "panning";
        dispatchViewport({
          type: "PAN_START",
          payload: { screen: local, mode },
        });
        return;
      }

      if (e.button === 0) {
        if (currentTool === "hand") {
          dispatchViewport({
            type: "PAN_START",
            payload: { screen: local, mode: "panning" },
          });
          return;
        }

        if (currentTool === "select") {
          // Check if we hit a shape directly
          let hitShape = getShapeAtPoint(world, shapesList);

          // If no direct hit, check if we hit the bounding box of a selected shape
          if (!hitShape) {
            const selectedIds = Object.keys(selectedShapes);
            for (const id of selectedIds) {
              const shape = shapesState.shapes.entities[id];
              if (
                shape &&
                intersectsSelectionBox(shape, { start: world, current: world })
              ) {
                hitShape = shape;
                break;
              }
            }
          }

          if (hitShape) {
            const isAlreadySelected = selectedShapes[hitShape.id];
            if (!isAlreadySelected) {
              if (!e.shiftKey) dispatchShapes({ type: "CLEAR_SELECTION" });
              dispatchShapes({ type: "SELECT_SHAPE", payload: hitShape.id });
            }

            isMovingRef.current = true;
            moveStartRef.current = world;

            // Store initial positions for shapes that will be moved
            initialShapePositionsRef.current = {};

            // If the shape was already selected, store positions for all selected shapes
            // If it's newly selected, only store position for this shape
            const shapesToStore = isAlreadySelected
              ? Object.keys(selectedShapes)
              : [hitShape.id];

            shapesToStore.forEach((id) => {
              const shape = shapesState.shapes.entities[id];
              if (shape) {
                if (
                  shape.type === "frame" ||
                  shape.type === "rect" ||
                  shape.type === "ellipse" ||
                  shape.type === "generatedui"
                ) {
                  initialShapePositionsRef.current[id] = {
                    x: shape.x,
                    y: shape.y,
                  };
                } else if (shape.type === "freedraw") {
                  initialShapePositionsRef.current[id] = {
                    points: [...shape.points],
                  };
                } else if (shape.type === "arrow" || shape.type === "line") {
                  initialShapePositionsRef.current[id] = {
                    startX: shape.startX,
                    startY: shape.startY,
                    endX: shape.endX,
                    endY: shape.endY,
                  };
                } else if (shape.type === "text") {
                  initialShapePositionsRef.current[id] = {
                    x: shape.x,
                    y: shape.y,
                  };
                }
              }
            });
          } else {
            // Clicked on empty space - start selection box or clear selection
            if (!e.shiftKey) {
              dispatchShapes({ type: "CLEAR_SELECTION" });
              blurActiveTextInput();
              // Start selection box
              isSelectingRef.current = true;
              selectionBoxRef.current = { start: world, current: world };
            }
          }
        } else if (currentTool === "eraser") {
          isErasingRef.current = true;
          erasedShapesRef.current.clear();
          const hitShape = getShapeAtPoint(world, shapesList, {
            allowBoundsFallback: false,
          });
          if (hitShape) {
            dispatchShapes({ type: "REMOVE_SHAPE", payload: hitShape.id });
            erasedShapesRef.current.add(hitShape.id);
          } else {
            blurActiveTextInput();
          }
        } else if (currentTool === "text") {
          dispatchShapes({
            type: "ADD_TEXT",
            payload: { x: world.x, y: world.y },
          });
          dispatchShapes({ type: "SET_TOOL", payload: "select" });
        } else {
          isDrawingRef.current = true;
          if (
            currentTool === "frame" ||
            currentTool === "rect" ||
            currentTool === "ellipse" ||
            currentTool === "arrow" ||
            currentTool === "line"
          ) {
            draftShapeRef.current = {
              type: currentTool,
              startWorld: world,
              currentWorld: world,
            };
            requestRender();
          } else if (currentTool === "freedraw") {
            freeDrawPointsRef.current = [world];
            lastFreehandFrameRef.current = performance.now();
            freehandRafRef.current = window.requestAnimationFrame(freehandTick);
            requestRender();
          }
        }
      }
    }
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const local = getLocalPointFromPtr(e.nativeEvent);
    const world = screenToWorld(local, viewport.translate, viewport.scale);

    if (viewport.mode === "panning" || viewport.mode === "shiftPanning") {
      schedulePanMove(local);
      return;
    }

    if (isErasingRef.current && currentTool === "eraser") {
      const hitShape = getShapeAtPoint(world, shapesList, {
        allowBoundsFallback: false,
      });
      if (hitShape && !erasedShapesRef.current.has(hitShape.id)) {
        dispatchShapes({ type: "REMOVE_SHAPE", payload: hitShape.id });
        erasedShapesRef.current.add(hitShape.id);
      }
    }

    if (
      isMovingRef.current &&
      moveStartRef.current &&
      currentTool === "select"
    ) {
      const deltaX = world.x - moveStartRef.current.x;
      const deltaY = world.y - moveStartRef.current.y;

      Object.keys(initialShapePositionsRef.current).forEach((id) => {
        const initialPos = initialShapePositionsRef.current[id];
        const shape = shapesState.shapes.entities[id];
        if (shape && initialPos) {
          if (
            shape.type === "frame" ||
            shape.type === "rect" ||
            shape.type === "ellipse" ||
            shape.type === "generatedui" ||
            shape.type === "text"
          ) {
            if (
              typeof initialPos.x === "number" &&
              typeof initialPos.y === "number"
            ) {
              dispatchShapes({
                type: "UPDATE_SHAPE",
                payload: {
                  id,
                  patch: {
                    x: initialPos.x + deltaX,
                    y: initialPos.y + deltaY,
                  },
                },
              });
            }
          } else if (shape.type === "freedraw") {
            const initialPoints = initialPos.points;
            if (initialPoints) {
              const newPoints = initialPoints.map((point) => ({
                x: point.x + deltaX,
                y: point.y + deltaY,
              }));
              dispatchShapes({
                type: "UPDATE_SHAPE",
                payload: {
                  id,
                  patch: {
                    points: newPoints,
                  },
                },
              });
            }
          } else if (shape.type === "arrow" || shape.type === "line") {
            if (
              typeof initialPos.startX === "number" &&
              typeof initialPos.startY === "number" &&
              typeof initialPos.endX === "number" &&
              typeof initialPos.endY === "number"
            ) {
              dispatchShapes({
                type: "UPDATE_SHAPE",
                payload: {
                  id,
                  patch: {
                    startX: initialPos.startX + deltaX,
                    startY: initialPos.startY + deltaY,
                    endX: initialPos.endX + deltaX,
                    endY: initialPos.endY + deltaY,
                  },
                },
              });
            }
          }
        }
      });
    }

    if (isSelectingRef.current && selectionBoxRef.current) {
      selectionBoxRef.current.current = world;
      requestRender();
    }

    if (isDrawingRef.current) {
      if (draftShapeRef.current) {
        draftShapeRef.current.currentWorld = world;
        requestRender();
      } else if (currentTool === "freedraw") {
        freeDrawPointsRef.current.push(world);
      }
    }
  };

  const finalizeDrawingIfAny = (): void => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (freehandRafRef.current) {
      window.cancelAnimationFrame(freehandRafRef.current);
      freehandRafRef.current = null;
    }

    const draft = draftShapeRef.current;
    if (draft) {
      const x = Math.min(draft.startWorld.x, draft.currentWorld.x);
      const y = Math.min(draft.startWorld.y, draft.currentWorld.y);
      const w = Math.abs(draft.currentWorld.x - draft.startWorld.x);
      const h = Math.abs(draft.currentWorld.y - draft.startWorld.y);

      if (w > 1 && h > 1) {
        if (draft.type === "frame") {
          dispatchShapes({ type: "ADD_FRAME", payload: { x, y, w, h } });
        } else if (draft.type === "rect") {
          dispatchShapes({ type: "ADD_RECT", payload: { x, y, w, h } });
        } else if (draft.type === "ellipse") {
          dispatchShapes({ type: "ADD_ELLIPSE", payload: { x, y, w, h } });
        } else if (draft.type === "arrow") {
          dispatchShapes({
            type: "ADD_ARROW",
            payload: {
              startX: draft.startWorld.x,
              startY: draft.startWorld.y,
              endX: draft.currentWorld.x,
              endY: draft.currentWorld.y,
            },
          });
        } else if (draft.type === "line") {
          dispatchShapes({
            type: "ADD_LINE",
            payload: {
              startX: draft.startWorld.x,
              startY: draft.startWorld.y,
              endX: draft.currentWorld.x,
              endY: draft.currentWorld.y,
            },
          });
        }
      }
      draftShapeRef.current = null;
    } else if (currentTool === "freedraw") {
      const pts = freeDrawPointsRef.current;
      if (pts.length > 1) {
        dispatchShapes({ type: "ADD_FREEDRAW", payload: { points: pts } });
      }
      freeDrawPointsRef.current = [];
    }

    // Auto-switch to select tool after drawing (except for eraser)
    if (currentTool !== "select" && currentTool !== "eraser") {
      dispatchShapes({ type: "SET_TOOL", payload: "select" });
    }

    requestRender();
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    canvasRef.current?.releasePointerCapture?.(e.pointerId);

    if (viewport.mode === "panning" || viewport.mode === "shiftPanning") {
      dispatchViewport({ type: "PAN_END" });
      return;
    }

    if (isMovingRef.current) {
      isMovingRef.current = false;
      moveStartRef.current = null;
      initialShapePositionsRef.current = {};
    }

    if (isErasingRef.current) {
      isErasingRef.current = false;
      erasedShapesRef.current.clear();
    }

    if (isSelectingRef.current && selectionBoxRef.current) {
      const box = selectionBoxRef.current;
      const selectedIds = shapesList
        .filter((shape) => intersectsSelectionBox(shape, box))
        .map((shape) => shape.id);

      selectedIds.forEach((id) => {
        dispatchShapes({ type: "SELECT_SHAPE", payload: id });
      });

      isSelectingRef.current = false;
      selectionBoxRef.current = null;
      requestRender();
    }

    finalizeDrawingIfAny();
  };

  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = (e) => {
    onPointerUp(e);
  };

  const onDoubleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA") {
      return;
    }

    if (isInteractiveTarget(target)) {
      return;
    }

    e.preventDefault();

    const local = getLocalPointFromPtr(e.nativeEvent);
    const world = screenToWorld(local, viewport.translate, viewport.scale);
    const hitShape = getShapeAtPoint(world, shapesList);

    if (hitShape?.type === "text") {
      dispatchShapes({ type: "SET_EDITING_TEXT", payload: hitShape.id });
    }
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const originScreen = localPointFromClient(e.clientX, e.clientY);

    // Check for pinch-to-zoom gesture (ctrlKey is often set on trackpads)
    // or explicit mouse wheel zoom (metaKey/ctrlKey)
    if (e.ctrlKey || e.metaKey) {
      dispatchViewport({
        type: "WHEEL_ZOOM",
        payload: { deltaY: e.deltaY, originScreen },
      });
    } else {
      // Pan handling
      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      const dy = e.shiftKey ? 0 : e.deltaY;
      dispatchViewport({
        type: "WHEEL_PAN",
        payload: { dx: -dx, dy: -dy },
      });
    }
  };

  const attachCanvasRef = (ref: HTMLDivElement | null): void => {
    // Clean up any existing event listeners on the old canvas
    if (canvasRef.current) {
      canvasRef.current.removeEventListener("wheel", onWheel);
    }

    // Store the new canvas reference
    canvasRef.current = ref;

    // Add wheel event listener to the new canvas (for zoom/pan)
    if (ref) {
      ref.addEventListener("wheel", onWheel, { passive: false });
    }
  };

  const selectTool = (tool: Tool): void => {
    dispatchShapes({ type: "SET_TOOL", payload: tool });
  };

  const getDraftShape = (): DraftShape | null => draftShapeRef.current;

  const getFreeDrawPoints = (): readonly Point[] => freeDrawPointsRef.current;

  const zoomIn = (): void => {
    dispatchViewport({ type: "ZOOM_IN" });
  };

  const zoomOut = (): void => {
    dispatchViewport({ type: "ZOOM_OUT" });
  };

  const resetZoom = (): void => {
    const canvasEl = canvasRef.current;
    if (canvasEl) {
      const rect = canvasEl.getBoundingClientRect();
      const center = { x: rect.width / 2, y: rect.height / 2 };
      dispatchViewport({
        type: "SET_SCALE",
        payload: { scale: 1, originScreen: center },
      });
    } else {
      dispatchViewport({ type: "SET_ZOOM", payload: 1 });
    }
  };

  const getSelectionBox = (): { start: Point; current: Point } | null =>
    selectionBoxRef.current;

  return {
    viewport,
    shapes: shapesList,
    currentTool,
    activeTool,
    selectedShapes,
    isSidebarOpen,
    hasSelectedText,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onDoubleClick,
    attachCanvasRef,
    selectTool,
    getDraftShape,
    getFreeDrawPoints,
    setIsSidebarOpen,
    zoomIn,
    zoomOut,
    resetZoom,
    getSelectionBox,
  };
}

// Helper function to check if shape intersects with selection box
function intersectsSelectionBox(
  shape: Shape,
  box: { start: Point; current: Point }
): boolean {
  const boxMinX = Math.min(box.start.x, box.current.x);
  const boxMaxX = Math.max(box.start.x, box.current.x);
  const boxMinY = Math.min(box.start.y, box.current.y);
  const boxMaxY = Math.max(box.start.y, box.current.y);

  // Calculate shape bounds
  let shapeMinX: number,
    shapeMaxX: number,
    shapeMinY: number,
    shapeMaxY: number;

  switch (shape.type) {
    case "frame":
    case "rect":
    case "ellipse":
    case "generatedui":
      shapeMinX = shape.x;
      shapeMaxX = shape.x + shape.w;
      shapeMinY = shape.y;
      shapeMaxY = shape.y + shape.h;
      break;

    case "text": {
      const { width, height } = getTextShapeDimensions(shape);
      shapeMinX = shape.x;
      shapeMaxX = shape.x + width;
      shapeMinY = shape.y;
      shapeMaxY = shape.y + height;
      break;
    }

    case "freedraw": {
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      shapeMinX = Math.min(...xs);
      shapeMaxX = Math.max(...xs);
      shapeMinY = Math.min(...ys);
      shapeMaxY = Math.max(...ys);
      break;
    }

    case "arrow":
    case "line":
      shapeMinX = Math.min(shape.startX, shape.endX);
      shapeMaxX = Math.max(shape.startX, shape.endX);
      shapeMinY = Math.min(shape.startY, shape.endY);
      shapeMaxY = Math.max(shape.startY, shape.endY);
      break;
  }

  // Check if rectangles intersect
  return !(
    shapeMaxX < boxMinX ||
    shapeMinX > boxMaxX ||
    shapeMaxY < boxMinY ||
    shapeMinY > boxMaxY
  );
}
