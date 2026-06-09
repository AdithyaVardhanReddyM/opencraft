import type {
  ShapesState,
  Tool,
  Shape,
  EntityState,
  Point,
} from "@/types/canvas";
import {
  createEntityState,
  addEntity,
  updateEntity,
  removeEntity,
  removeMany,
  removeAll,
} from "./entity-adapter";
import {
  createFrame,
  createRect,
  createEllipse,
  createFreeDraw,
  createArrow,
  createLine,
  createText,
  createGeneratedUI,
  createScreen,
} from "./shape-factories";
import {
  createHistoryEntry,
  addToHistory,
  undo as historyUndo,
  redo as historyRedo,
} from "./history-manager";

const emptyShapesState = createEntityState<Shape>();

// Action types
interface ShapesActionMeta {
  meta?: {
    skipHistory?: boolean;
  };
}

type ShapesActionCore =
  | { type: "SET_TOOL"; payload: Tool }
  | {
      type: "ADD_FRAME";
      payload: { x: number; y: number; w: number; h: number };
    }
  | {
      type: "ADD_RECT";
      payload: {
        x: number;
        y: number;
        w: number;
        h: number;
        stroke?: string;
        strokeWidth?: number;
        strokeType?: "solid" | "dashed";
        borderRadius?: number;
      };
    }
  | {
      type: "ADD_ELLIPSE";
      payload: {
        x: number;
        y: number;
        w: number;
        h: number;
        stroke?: string;
        strokeWidth?: number;
        strokeType?: "solid" | "dashed";
      };
    }
  | {
      type: "ADD_FREEDRAW";
      payload: {
        points: Point[];
        stroke?: string;
        strokeWidth?: number;
        strokeType?: "solid" | "dashed";
      };
    }
  | {
      type: "ADD_ARROW";
      payload: {
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        stroke?: string;
        strokeWidth?: number;
        strokeType?: "solid" | "dashed";
      };
    }
  | {
      type: "ADD_LINE";
      payload: {
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        stroke?: string;
        strokeWidth?: number;
        strokeType?: "solid" | "dashed";
      };
    }
  | { type: "ADD_TEXT"; payload: { x: number; y: number } }
  | {
      type: "ADD_GENERATED_UI";
      payload: {
        x: number;
        y: number;
        w: number;
        h: number;
        uiSpecData: string | null;
        sourceFrameId: string;
      };
    }
  | {
      type: "ADD_SCREEN";
      payload: {
        x: number;
        y: number;
        w?: number;
        h?: number;
        screenId: string;
        id?: string; // Optional: use specific shape ID (for Convex linking)
      };
    }
  | { type: "UPDATE_SHAPE"; payload: { id: string; patch: Partial<Shape> } }
  | { type: "REMOVE_SHAPE"; payload: string }
  | { type: "CLEAR_ALL" }
  | { type: "SELECT_SHAPE"; payload: string }
  | { type: "DESELECT_SHAPE"; payload: string }
  | { type: "CLEAR_SELECTION" }
  | { type: "SELECT_ALL" }
  | { type: "DELETE_SELECTED" }
  | { type: "PUSH_HISTORY" }
  | { type: "SET_EDITING_TEXT"; payload: string | null }
  | {
      type: "LOAD_PROJECT";
      payload: {
        shapes: EntityState<Shape>;
        tool: Tool;
        selected: Record<string, true>;
        frameCounter: number;
        history?: import("@/types/canvas").HistoryEntry[];
        historyPointer?: number;
      };
    }
  | { type: "UNDO" }
  | { type: "REDO" }
  | {
      type: "PASTE_SHAPES";
      payload: { shapes: Shape[]; pastePosition: Point };
    }
  | {
      type: "REORDER_SHAPE";
      payload: { shapeId: string; newIndex: number };
    };

export type ShapesAction = ShapesActionCore & ShapesActionMeta;

// Initial state
export const initialShapesState: ShapesState = {
  tool: "select",
  shapes: emptyShapesState,
  selected: {},
  frameCounter: 0,
  editingTextId: null,
  history: [createHistoryEntry(emptyShapesState, {}, 0)],
  historyPointer: 0,
};

function recordHistoryIfNeeded(
  prevState: ShapesState,
  snapshot: Pick<ShapesState, "shapes" | "selected" | "frameCounter">,
  action: ShapesAction
): { history: ShapesState["history"]; pointer: number } {
  if (action.meta?.skipHistory) {
    return { history: prevState.history, pointer: prevState.historyPointer };
  }

  const historyEntry = createHistoryEntry(
    snapshot.shapes,
    snapshot.selected,
    snapshot.frameCounter
  );

  return addToHistory(
    prevState.history,
    prevState.historyPointer,
    historyEntry
  );
}

function applyStateChange(
  state: ShapesState,
  action: ShapesAction,
  mutate: (state: ShapesState) => ShapesState
): ShapesState {
  const nextState = mutate(state);
  const { history, pointer } = recordHistoryIfNeeded(
    state,
    {
      shapes: nextState.shapes,
      selected: nextState.selected,
      frameCounter: nextState.frameCounter,
    },
    action
  );

  return {
    ...nextState,
    history,
    historyPointer: pointer,
  };
}

// Reducer
export function shapesReducer(
  state: ShapesState,
  action: ShapesAction
): ShapesState {
  switch (action.type) {
    case "SET_TOOL": {
      const preservesSelection =
        action.payload === "select" || action.payload === "hand";
      return {
        ...state,
        tool: action.payload,
        selected: preservesSelection ? state.selected : {},
      };
    }

    case "ADD_FRAME": {
      const frameCounter = state.frameCounter + 1;
      const frame = createFrame({
        ...action.payload,
        frameNumber: frameCounter,
      });

      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: addEntity(current.shapes, frame),
        frameCounter,
      }));
    }

    case "ADD_RECT": {
      const rect = createRect(action.payload);
      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: addEntity(current.shapes, rect),
      }));
    }

    case "ADD_ELLIPSE": {
      const ellipse = createEllipse(action.payload);
      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: addEntity(current.shapes, ellipse),
      }));
    }

    case "ADD_FREEDRAW": {
      const { points } = action.payload;
      if (!points || points.length === 0) {
        return state;
      }

      const freedraw = createFreeDraw({ points });
      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: addEntity(current.shapes, freedraw),
      }));
    }

    case "ADD_ARROW": {
      const arrow = createArrow(action.payload);
      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: addEntity(current.shapes, arrow),
      }));
    }

    case "ADD_LINE": {
      const line = createLine(action.payload);
      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: addEntity(current.shapes, line),
      }));
    }

    case "ADD_TEXT": {
      const text = createText(action.payload);
      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: addEntity(current.shapes, text),
        editingTextId: text.id,
      }));
    }

    case "ADD_GENERATED_UI": {
      const generatedUI = createGeneratedUI(action.payload);
      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: addEntity(current.shapes, generatedUI),
      }));
    }

    case "ADD_SCREEN": {
      const screen = createScreen({
        x: action.payload.x,
        y: action.payload.y,
        w: action.payload.w,
        h: action.payload.h,
        screenId: action.payload.screenId,
        id: action.payload.id, // Pass optional id for Convex linking
      });
      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: addEntity(current.shapes, screen),
      }));
    }

    case "UPDATE_SHAPE": {
      const { id, patch } = action.payload;
      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: updateEntity(current.shapes, id, patch),
      }));
    }

    case "REMOVE_SHAPE": {
      const id = action.payload;

      const newSelected = { ...state.selected };
      delete newSelected[id];

      const removed = removeEntity(state.shapes, id);
      const { shapes: renumberedShapes, frameCount } =
        renumberFramesState(removed);

      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: renumberedShapes,
        selected: newSelected,
        frameCounter: frameCount,
      }));
    }

    case "CLEAR_ALL": {
      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: removeAll<Shape>(),
        selected: {},
        frameCounter: 0,
      }));
    }

    case "SELECT_SHAPE":
      return {
        ...state,
        selected: {
          ...state.selected,
          [action.payload]: true,
        },
      };

    case "DESELECT_SHAPE": {
      const newSelected = { ...state.selected };
      delete newSelected[action.payload];
      return {
        ...state,
        selected: newSelected,
      };
    }

    case "CLEAR_SELECTION":
      return {
        ...state,
        selected: {},
      };

    case "SELECT_ALL": {
      const allSelected: Record<string, true> = {};
      state.shapes.ids.forEach((id) => {
        allSelected[id] = true;
      });
      return {
        ...state,
        selected: allSelected,
      };
    }

    case "DELETE_SELECTED": {
      const idsToDelete = Object.keys(state.selected);
      if (idsToDelete.length === 0) {
        return state;
      }

      const removed = removeMany(state.shapes, idsToDelete);
      const { shapes: renumberedShapes, frameCount } =
        renumberFramesState(removed);

      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: renumberedShapes,
        selected: {},
        editingTextId: null,
        frameCounter: frameCount,
      }));
    }

    case "PUSH_HISTORY": {
      const { history, pointer } = recordHistoryIfNeeded(
        state,
        {
          shapes: state.shapes,
          selected: state.selected,
          frameCounter: state.frameCounter,
        },
        action
      );

      return {
        ...state,
        history,
        historyPointer: pointer,
      };
    }

    case "SET_EDITING_TEXT":
      return {
        ...state,
        editingTextId: action.payload,
      };

    case "LOAD_PROJECT": {
      // Ensure shapes has valid EntityState structure
      const loadedShapes = action.payload.shapes;
      const validShapes: EntityState<Shape> =
        loadedShapes &&
        Array.isArray(loadedShapes.ids) &&
        typeof loadedShapes.entities === "object"
          ? loadedShapes
          : emptyShapesState;

      // Ensure selected is a valid object
      const validSelected =
        action.payload.selected &&
        typeof action.payload.selected === "object" &&
        !Array.isArray(action.payload.selected)
          ? action.payload.selected
          : {};

      return {
        ...state,
        shapes: validShapes,
        tool: action.payload.tool || "select",
        selected: validSelected,
        frameCounter: action.payload.frameCounter || 0,
        editingTextId: null,
        history: action.payload.history || [],
        historyPointer: action.payload.historyPointer ?? -1,
      };
    }

    case "UNDO": {
      const { entry, pointer } = historyUndo(
        state.history,
        state.historyPointer
      );

      if (!entry) {
        // No undo available
        return state;
      }

      return {
        ...state,
        shapes: entry.shapes,
        selected: entry.selected,
        frameCounter: entry.frameCounter,
        historyPointer: pointer,
      };
    }

    case "REDO": {
      const { entry, pointer } = historyRedo(
        state.history,
        state.historyPointer
      );

      if (!entry) {
        // No redo available
        return state;
      }

      return {
        ...state,
        shapes: entry.shapes,
        selected: entry.selected,
        frameCounter: entry.frameCounter,
        historyPointer: pointer,
      };
    }

    case "REORDER_SHAPE": {
      const { shapeId, newIndex } = action.payload;
      const currentIndex = state.shapes.ids.indexOf(shapeId);

      if (currentIndex === -1 || currentIndex === newIndex) {
        return state;
      }

      const newIds = [...state.shapes.ids];
      newIds.splice(currentIndex, 1);
      newIds.splice(newIndex, 0, shapeId);

      return applyStateChange(state, action, (current) => ({
        ...current,
        shapes: {
          ...current.shapes,
          ids: newIds,
        },
      }));
    }

    case "PASTE_SHAPES": {
      const { shapes: shapesToPaste, pastePosition } = action.payload;
      if (shapesToPaste.length === 0) return state;

      // Calculate bounding box of shapes to paste
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const shape of shapesToPaste) {
        const bounds = getFullShapeBounds(shape);
        if (bounds) {
          minX = Math.min(minX, bounds.x);
          minY = Math.min(minY, bounds.y);
          maxX = Math.max(maxX, bounds.x + bounds.w);
          maxY = Math.max(maxY, bounds.y + bounds.h);
        }
      }

      // Calculate center of the selection
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Calculate offset to center shapes at paste position
      const offsetX = pastePosition.x - centerX;
      const offsetY = pastePosition.y - centerY;

      let newShapes = state.shapes;
      let frameCounter = state.frameCounter;
      const newSelected: Record<string, true> = {};

      for (const shape of shapesToPaste) {
        const cloned = cloneShapeWithOffset(shape, offsetX, offsetY, () => {
          frameCounter += 1;
          return frameCounter;
        });
        newShapes = addEntity(newShapes, cloned);
        newSelected[cloned.id] = true;
      }

      return applyStateChange(state, action, () => ({
        ...state,
        shapes: newShapes,
        selected: newSelected,
        frameCounter,
      }));
    }

    default:
      return state;
  }
}

function renumberFramesState(shapes: EntityState<Shape>): {
  shapes: EntityState<Shape>;
  frameCount: number;
} {
  let frameCount = 0;
  const entities: EntityState<Shape>["entities"] = { ...shapes.entities };

  shapes.ids.forEach((id) => {
    const shape = entities[id];
    if (shape?.type === "frame") {
      frameCount += 1;
      entities[id] = {
        ...shape,
        frameNumber: frameCount,
      };
    }
  });

  return {
    shapes: {
      ids: shapes.ids,
      entities,
    },
    frameCount,
  };
}

// Helper to get full shape bounds (position + dimensions) for paste positioning
function getFullShapeBounds(
  shape: Shape
): { x: number; y: number; w: number; h: number } | null {
  switch (shape.type) {
    case "frame":
    case "rect":
    case "ellipse":
    case "generatedui":
    case "screen":
      return { x: shape.x, y: shape.y, w: shape.w, h: shape.h };
    case "text":
      return { x: shape.x, y: shape.y, w: shape.w ?? 100, h: shape.h ?? 20 };
    case "freedraw": {
      if (shape.points.length === 0) return null;
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    case "arrow":
    case "line": {
      const minX = Math.min(shape.startX, shape.endX);
      const minY = Math.min(shape.startY, shape.endY);
      const maxX = Math.max(shape.startX, shape.endX);
      const maxY = Math.max(shape.startY, shape.endY);
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    default:
      return null;
  }
}

// Clone a shape with new ID and offset position
function cloneShapeWithOffset(
  shape: Shape,
  offsetX: number,
  offsetY: number,
  getNextFrameNumber: () => number
): Shape {
  const { nanoid } = require("nanoid");
  const newId = nanoid();

  switch (shape.type) {
    case "frame":
      return {
        ...shape,
        id: newId,
        x: shape.x + offsetX,
        y: shape.y + offsetY,
        frameNumber: getNextFrameNumber(),
      };
    case "rect":
      return {
        ...shape,
        id: newId,
        x: shape.x + offsetX,
        y: shape.y + offsetY,
      };
    case "ellipse":
      return {
        ...shape,
        id: newId,
        x: shape.x + offsetX,
        y: shape.y + offsetY,
      };
    case "text":
      return {
        ...shape,
        id: newId,
        x: shape.x + offsetX,
        y: shape.y + offsetY,
      };
    case "generatedui":
      return {
        ...shape,
        id: newId,
        x: shape.x + offsetX,
        y: shape.y + offsetY,
      };
    case "freedraw":
      return {
        ...shape,
        id: newId,
        points: shape.points.map((p) => ({
          x: p.x + offsetX,
          y: p.y + offsetY,
        })),
      };
    case "arrow":
      return {
        ...shape,
        id: newId,
        startX: shape.startX + offsetX,
        startY: shape.startY + offsetY,
        endX: shape.endX + offsetX,
        endY: shape.endY + offsetY,
      };
    case "line":
      return {
        ...shape,
        id: newId,
        startX: shape.startX + offsetX,
        startY: shape.startY + offsetY,
        endX: shape.endX + offsetX,
        endY: shape.endY + offsetY,
      };
    case "screen":
      return {
        ...shape,
        id: newId,
        x: shape.x + offsetX,
        y: shape.y + offsetY,
      };
  }
}
