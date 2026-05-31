// Core geometric types
export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Viewport types
export type ViewportMode = "idle" | "panning" | "shiftPanning";

export interface ViewportState {
  scale: number;
  minScale: number;
  maxScale: number;
  translate: Point;
  mode: ViewportMode;
  panStartScreen: Point | null;
  panStartTranslate: Point | null;
  wheelPanSpeed: number;
  zoomStep: number;
}

// Tool types
export type Tool =
  | "select"
  | "hand"
  | "frame"
  | "rect"
  | "ellipse"
  | "freedraw"
  | "arrow"
  | "line"
  | "text"
  | "eraser";

export type ResizeHandle =
  | "nw"
  | "ne"
  | "sw"
  | "se"
  | "n"
  | "s"
  | "e"
  | "w"
  | "line-start"
  | "line-end";

// Shape types
export interface BaseShape {
  id: string;
  stroke: string;
  strokeWidth: number;
  fill?: string | null;
}

export interface FrameShape extends BaseShape {
  type: "frame";
  x: number;
  y: number;
  w: number;
  h: number;
  frameNumber: number;
}

export interface RectShape extends BaseShape {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EllipseShape extends BaseShape {
  type: "ellipse";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FreeDrawShape extends BaseShape {
  type: "freedraw";
  points: Point[];
}

export interface ArrowShape extends BaseShape {
  type: "arrow";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface LineShape extends BaseShape {
  type: "line";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface TextShape extends BaseShape {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  textAlign: "left" | "center" | "right";
  textDecoration: "none" | "underline" | "line-through";
  lineHeight: number;
  letterSpacing: number;
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  w?: number;
  h?: number;
}

export interface GeneratedUIShape extends BaseShape {
  type: "generatedui";
  x: number;
  y: number;
  w: number;
  h: number;
  uiSpecData: string | null;
  sourceFrameId: string;
  isWorkflowPage?: boolean;
}

export type Shape =
  | FrameShape
  | RectShape
  | EllipseShape
  | FreeDrawShape
  | ArrowShape
  | LineShape
  | TextShape
  | GeneratedUIShape;

// Entity state (normalized data structure)
export interface EntityState<T> {
  ids: string[];
  entities: Record<string, T>;
}

// Selection state
export type SelectionMap = Record<string, true>;

// Shapes state
export interface ShapesState {
  tool: Tool;
  shapes: EntityState<Shape>;
  selected: SelectionMap;
  frameCounter: number;
  editingTextId: string | null;
}

// Draft shape (temporary shape during drawing)
export interface DraftShape {
  type: "frame" | "rect" | "ellipse" | "arrow" | "line";
  startWorld: Point;
  currentWorld: Point;
}

// Touch pointer (for multi-touch support)
export interface TouchPointer {
  id: number;
  p: Point;
}

// Resize data
export interface ResizeData {
  shapeId: string;
  corner: ResizeHandle;
  initialBounds: { x: number; y: number; w: number; h: number };
  startPoint: { x: number; y: number };
}
