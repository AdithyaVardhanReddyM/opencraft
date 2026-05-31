---
inclusion: manual
---

# Canvas State Management

The infinite canvas system for Unit {set} uses **React Context + useReducer** for state management, providing a Redux-like architecture without the Redux dependency.

## Architecture Overview

The canvas system is built around two main state domains:

- **Viewport state** (pan/zoom)
- **Shapes state** (drawing entities)

### Core Principles

- **Immutable state updates** - All state changes use spread operators and pure functions
- **Normalized entity state** - Shapes stored as `{ ids: string[], entities: Record<string, Shape> }`
- **Separation of concerns** - Viewport and shapes managed independently
- **Performance-first** - RAF throttling, memoized computations, refs for non-reactive state
- **Type-safe** - Full TypeScript coverage with strict typing

## File Structure

```
contexts/
  CanvasContext.tsx      # React Context provider with viewport + shapes state

hooks/
  use-infinite-canvas.ts # Main hook for canvas interactions and event handling
  use-canvas-persistence.ts # Auto-save to localStorage, Convex integration

lib/canvas/
  coordinate-utils.ts    # Screen/world coordinate conversion, zoom calculations
  entity-adapter.ts      # Normalized entity state management (add/update/remove)
  hit-testing.ts         # Shape intersection and point-in-shape detection
  persistence.ts         # Serialize/deserialize, localStorage, Convex integration
  shape-factories.ts     # Factory functions for creating shapes with defaults
  shapes-reducer.ts      # Shapes state reducer (add/update/remove/select shapes)
  viewport-reducer.ts    # Viewport state reducer (pan/zoom/mode)
  README.md              # Detailed architecture documentation

types/
  canvas.ts              # All TypeScript types for canvas system
```

## State Management

### Canvas Context

The `CanvasContext` provides:

- `viewport: ViewportState` - Current viewport state (scale, translate, mode)
- `dispatchViewport: Dispatch<ViewportAction>` - Dispatch viewport actions
- `shapes: ShapesState` - Current shapes state (tool, shapes, selected, frameCounter)
- `dispatchShapes: Dispatch<ShapesAction>` - Dispatch shapes actions
- `shapesList: Shape[]` - Computed array of shapes (memoized)

Usage:

```tsx
import { useCanvasContext } from "@/contexts/CanvasContext";

function MyComponent() {
  const { viewport, dispatchViewport, shapes, dispatchShapes, shapesList } =
    useCanvasContext();

  // Dispatch actions
  dispatchViewport({
    type: "ZOOM_BY",
    payload: { factor: 1.2, originScreen: { x: 0, y: 0 } },
  });
  dispatchShapes({ type: "ADD_RECT", payload: { x, y, w, h } });
}
```

### Viewport State

**State Structure:**

```typescript
interface ViewportState {
  scale: number; // Current zoom level (0.1 to 8)
  minScale: number; // Minimum zoom (0.1)
  maxScale: number; // Maximum zoom (8)
  translate: Point; // Pan offset { x, y }
  mode: ViewportMode; // "idle" | "panning" | "shiftPanning"
  panStartScreen: Point | null; // Pan gesture start point
  panStartTranslate: Point | null; // Translate at pan start
  wheelPanSpeed: number; // Wheel pan multiplier (0.5)
  zoomStep: number; // Zoom step factor (1.06)
}
```

**Key Actions:**

- `SET_TRANSLATE` - Set pan offset directly
- `SET_SCALE` - Set zoom level (with optional origin point)
- `ZOOM_BY` - Zoom by factor around origin point
- `WHEEL_ZOOM` - Zoom via wheel event (Ctrl/Cmd + wheel)
- `WHEEL_PAN` - Pan via wheel event
- `PAN_START` / `PAN_MOVE` / `PAN_END` - Pan gesture handling
- `HAND_TOOL_ENABLE` / `HAND_TOOL_DISABLE` - Shift key hand tool
- `CENTER_ON_WORLD` - Center viewport on world coordinates
- `ZOOM_TO_FIT` - Fit bounds to viewport with padding
- `RESET_VIEW` - Reset to default (scale: 1, translate: 0,0)
- `RESTORE_VIEWPORT` - Restore saved viewport state

### Shapes State

**State Structure:**

```typescript
interface ShapesState {
  tool: Tool; // Current tool ("select" | "frame" | "rect" | etc.)
  shapes: EntityState<Shape>; // Normalized shapes { ids, entities }
  selected: SelectionMap; // Selected shape IDs { [id]: true }
  frameCounter: number; // Auto-incrementing frame numbers
}
```

**Key Actions:**

- `SET_TOOL` - Change current tool
- `ADD_FRAME` / `ADD_RECT` / `ADD_ELLIPSE` / `ADD_FREEDRAW` / `ADD_ARROW` / `ADD_LINE` / `ADD_TEXT` / `ADD_GENERATED_UI` - Add shapes
- `UPDATE_SHAPE` - Update shape with partial changes
- `REMOVE_SHAPE` - Remove single shape
- `CLEAR_ALL` - Remove all shapes
- `SELECT_SHAPE` / `DESELECT_SHAPE` / `CLEAR_SELECTION` / `SELECT_ALL` - Selection management
- `DELETE_SELECTED` - Delete all selected shapes
- `LOAD_PROJECT` - Load entire project state

## Shape Types

All shapes extend `BaseShape`:

```typescript
interface BaseShape {
  id: string; // Unique ID (nanoid)
  stroke: string; // Stroke color
  strokeWidth: number; // Stroke width
  fill?: string | null; // Fill color (optional)
}
```

**Shape Types:**

1. **FrameShape** - Rectangular frames with auto-incrementing numbers

   - Properties: `x, y, w, h, frameNumber`
   - Default: transparent stroke, semi-transparent fill

2. **RectShape** - Rectangles

   - Properties: `x, y, w, h`

3. **EllipseShape** - Ellipses

   - Properties: `x, y, w, h`

4. **FreeDrawShape** - Freehand paths

   - Properties: `points: Point[]`

5. **ArrowShape** - Arrows with arrowheads

   - Properties: `startX, startY, endX, endY`

6. **LineShape** - Straight lines

   - Properties: `startX, startY, endX, endY`

7. **TextShape** - Text with full typography controls

   - Properties: `x, y, text, fontSize, fontFamily, fontWeight, fontStyle, textAlign, textDecoration, lineHeight, letterSpacing, textTransform`

8. **GeneratedUIShape** - AI-generated UI component
   - Properties: `x, y, w, h, uiSpecData, sourceFrameId, isWorkflowPage`

## Coordinate System

The canvas uses two coordinate systems:

- **Screen coordinates** - Pixel coordinates relative to canvas element
- **World coordinates** - Infinite canvas coordinates (independent of zoom/pan)

**Conversion utilities:**

```typescript
import { screenToWorld, worldToScreen } from "@/lib/canvas/coordinate-utils";

// Convert screen to world
const world = screenToWorld(screen, viewport.translate, viewport.scale);

// Convert world to screen
const screen = worldToScreen(world, viewport.translate, viewport.scale);
```

**Zoom around point:**

```typescript
import { zoomAroundScreenPoint } from "@/lib/canvas/coordinate-utils";

// Calculate new translate that keeps originScreen pointing at same world point
const newTranslate = zoomAroundScreenPoint(
  originScreen,
  newScale,
  currentTranslate,
  currentScale
);
```

## Hit Testing

Hit testing determines which shape is at a given point:

```typescript
import { getShapeAtPoint, isPointInShape } from "@/lib/canvas/hit-testing";

// Get topmost shape at point (respects z-order)
const shape = getShapeAtPoint(worldPoint, shapes);

// Check if point is inside specific shape
const isInside = isPointInShape(worldPoint, shape);
```

**Hit testing thresholds:**

- Freedraw: 5px
- Line/Arrow: 8px
- Text: 2px margin around bounds

## Entity Adapter

The entity adapter provides normalized state management:

```typescript
import {
  createEntityState,
  addEntity,
  updateEntity,
  removeEntity,
  removeMany,
  removeAll,
} from "@/lib/canvas/entity-adapter";

// Create empty entity state
const state = createEntityState<Shape>();

// Add entity
const newState = addEntity(state, shape);

// Update entity
const updatedState = updateEntity(state, id, { x: 100, y: 200 });

// Remove entity
const removedState = removeEntity(state, id);
```

## Shape Factories

Factory functions for creating shapes with default styling:

```typescript
import {
  createFrame,
  createRect,
  createEllipse,
  createFreeDraw,
  createArrow,
  createLine,
  createText,
  createGeneratedUI,
  SHAPE_DEFAULTS,
} from "@/lib/canvas/shape-factories";

// Default styling
SHAPE_DEFAULTS = { stroke: "#ffff", strokeWidth: 2 };

// Create shapes
const frame = createFrame({ x, y, w, h, frameNumber });
const rect = createRect({ x, y, w, h });
const text = createText({ x, y });
```

## Persistence

The persistence system handles saving/loading canvas state:

**Auto-save behavior:**

- Debounced auto-save to localStorage (1 second delay)
- Auto-load from localStorage on mount
- Convex integration ready (TODO: implement mutations/queries)

**localStorage operations:**

```typescript
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from "@/lib/canvas/persistence";

// Save
saveToLocalStorage(projectId, viewport, shapes);

// Load
const stored = loadFromLocalStorage(projectId);

// Clear
clearLocalStorage(projectId);
```

**Serialize/Deserialize state:**

```typescript
import {
  serializeCanvasState,
  deserializeCanvasState,
} from "@/lib/canvas/persistence";

// Serialize
const data = serializeCanvasState(viewport, shapes);

// Deserialize
const restored = deserializeCanvasState(data);
```

## Interaction Patterns

### Pan & Zoom

- **Pan**: Middle/right mouse button OR Shift + left mouse button
- **Zoom**: Ctrl/Cmd + wheel (zooms around cursor)
- **Wheel pan**: Wheel without modifiers (horizontal/vertical)
- **Hand tool**: Hold Shift to enable temporary hand tool

### Drawing Tools

1. **Select** - Click to select, drag to move, Shift+click for multi-select
2. **Frame** - Drag to draw frame, auto-increments frame number
3. **Rectangle** - Drag to draw rectangle
4. **Ellipse** - Drag to draw ellipse
5. **Freedraw** - Drag to draw freehand path (RAF-throttled)
6. **Arrow** - Drag to draw arrow
7. **Line** - Drag to draw line
8. **Text** - Click to place text, auto-switches to select tool
9. **Eraser** - Click or drag to erase shapes

### Selection & Movement

- Click shape to select (clears previous selection)
- Shift+click to add/remove from selection
- Drag selected shape(s) to move
- Click empty space to clear selection
- Drag on empty space to create selection box (multi-select)
- Delete/Backspace key to delete selected shapes
- Bounding boxes with resize handles shown for selected shapes

### Resizing

Shapes can be resized via custom DOM events:

```typescript
// Start resize
window.dispatchEvent(
  new CustomEvent("shape-resize-start", {
    detail: { shapeId, corner, bounds, clientX, clientY },
  })
);

// Move during resize
window.dispatchEvent(
  new CustomEvent("shape-resize-move", {
    detail: { clientX, clientY },
  })
);

// End resize
window.dispatchEvent(new CustomEvent("shape-resize-end"));
```

**Supported corners:**

- Rectangular shapes: `nw`, `ne`, `sw`, `se`, `n`, `s`, `e`, `w` (8 handles)
- Line/Arrow shapes: Start and end point handles only
- Freedraw shapes: Scales all points proportionally

**Resize behavior:**

- Maintains minimum size of 10px
- Handles edge cases (vertical/horizontal lines)
- Scales freedraw points while preserving shape
- Updates shape state via `UPDATE_SHAPE` action

## Performance Optimizations

### RAF Throttling

- **Freehand drawing**: 8ms interval between renders
- **Pan operations**: Batched with requestAnimationFrame
- **Resize operations**: Batched with requestAnimationFrame

### Non-Reactive Refs for State

Use refs for state that doesn't need to trigger re-renders:

- Touch pointers map
- Draft shape during drawing
- Freehand points buffer
- Interaction flags (isDrawing, isMoving, isErasing, isResizing)
- Movement tracking (moveStart, initialShapePositions)

### Memoization

- `shapesList` computed from entity state (memoized in context)

### Batched Operations

- **Pan operations**: Batched with requestAnimationFrame
- **Resize operations**: Batched with requestAnimationFrame

## UI Components

### Canvas UI Components

Located in `components/canvas/`:

1. **Toolbar** - Tool selection with icons

   - Fixed position at top center
   - Shows all available tools (select, frame, rect, ellipse, line, arrow, freedraw, text, eraser)
   - Highlights active tool with primary color
   - Uses Lucide React icons

2. **ZoomBar** - Zoom controls

   - Fixed position at bottom left
   - Shows current zoom percentage
   - Zoom in/out buttons with disabled states at min/max
   - Respects viewport min/max scale constraints

3. **HistoryPill** - Undo/redo controls

   - Fixed position at bottom left (next to zoom bar)
   - Undo/redo buttons with disabled states
   - Currently placeholder (TODO: implement history)

4. **BoundingBox** - Selection and resize handles

   - Renders for each selected shape
   - 8 resize handles for rectangular shapes (corners + edges)
   - 2 handles for line/arrow shapes (endpoints)
   - Orange border color (hsl(24 95% 53%))
   - Handles pointer events for resizing

5. **SelectionBox** - Multi-select box
   - Dashed orange border
   - Semi-transparent orange fill
   - Shown during drag-to-select on empty space

### Canvas Cursor Management

The `useCanvasCursor` hook manages cursor appearance:

```typescript
const { cursorClass } = useCanvasCursor();
```

**Cursor priority:**

1. Active panning → `cursor-grabbing`
2. Shift key held → `cursor-grab`
3. Current tool → Tool-specific cursor

**Tool cursors:**

- Select: `cursor-select`
- Frame/Rect/Ellipse/Line/Arrow: `cursor-crosshair`
- Freedraw: `cursor-pen`
- Text: `cursor-text`
- Eraser: `cursor-eraser`

## Hooks

### useInfiniteCanvas

Main hook for canvas interactions:

```typescript
const {
  viewport,
  shapes,
  currentTool,
  selectedShapes,
  isSidebarOpen,
  hasSelectedText,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  attachCanvasRef,
  selectTool,
  getDraftShape,
  getFreeDrawPoints,
  setIsSidebarOpen,
  zoomIn,
  zoomOut,
  getSelectionBox,
} = useInfiniteCanvas();
```

**Key features:**

- Handles all pointer events (down/move/up/cancel)
- Manages keyboard events (Shift for hand tool, Delete/Backspace for deletion)
- Handles resize events via custom DOM events
- Provides draft shape and freehand points for rendering
- Auto-opens sidebar for text selection
- Selection box for multi-select (drag on empty space)
- Zoom controls (zoomIn/zoomOut functions)
- Auto-switches to select tool after drawing (except eraser)

### useCanvasPersistence

Hook for state persistence:

```typescript
const { exportState, importState, saveToConvex, loadFromConvex } =
  useCanvasPersistence(projectId);
```

**Key features:**

- Auto-saves to localStorage (1 second debounce)
- Auto-load from localStorage on mount
- Export as JSON
- Import from JSON
- Convex integration ready (TODO: implement)

## Constants

```typescript
// RAF throttling
RAF_INTERVAL_MS = 8;

// Hit testing thresholds
FREEDRAW_HIT_THRESHOLD = 5;
LINE_HIT_THRESHOLD = 8;
TEXT_PADDING = 8;
TEXT_BOUNDS_MARGIN = 2;

// Viewport constraints
MIN_SCALE = 0.1;
MAX_SCALE = 8;
WHEEL_PAN_SPEED = 0.5;
ZOOM_STEP = 1.06;

// Shape defaults
SHAPE_DEFAULTS = { stroke: "#ffff", strokeWidth: 2 };
```

## Common Patterns

### Panning

```typescript
dispatchViewport({ type: "SET_TRANSLATE", payload: { x: 500, y: 500 } });
```

### Zooming

```typescript
// Zoom by factor
dispatchViewport({
  type: "ZOOM_BY",
  payload: { factor: 1.2, originScreen: { x: 0, y: 0 } },
});

// Zoom to fit bounds
dispatchViewport({
  type: "ZOOM_TO_FIT",
  payload: {
    bounds: { x, y, width, height },
    viewportPx: { width: canvasWidth, height: canvasHeight },
    padding: 50,
  },
});

// Center on world point
dispatchViewport({
  type: "CENTER_ON_WORLD",
  payload: { world: { x: 500, y: 500 } },
});
```

### Adding Shapes

```typescript
const { dispatchShapes } = useCanvasContext();

// Add rectangle
dispatchShapes({
  type: "ADD_RECT",
  payload: { x: 100, y: 100, w: 200, h: 150 },
});

// Add text
dispatchShapes({ type: "ADD_TEXT", payload: { x: 100, y: 200 } });
```

### Updating a Shape

```typescript
dispatchShapes({
  type: "UPDATE_SHAPE",
  payload: {
    id: shapeId,
    patch: { x: 200, y: 200 },
  },
});
```

### Selecting Shapes

```typescript
// Select single
dispatchShapes({ type: "SELECT_SHAPE", payload: shapeId });

// Clear selection
dispatchShapes({ type: "CLEAR_SELECTION" });

// Select all
dispatchShapes({ type: "SELECT_ALL" });
```

## Best Practices

1. **Always use context hooks** - Don't access state directly
2. **Dispatch actions for state changes** - Never mutate state
3. **Use coordinate utilities** - Don't manually calculate conversions
4. **Use shape factories** - Don't create shape objects manually
5. **Use entity adapter** - Don't manually manage normalized state
6. **Don't use refs for reactive state** - Use state for UI-triggering data
7. **Batch RAF operations** - Don't trigger excessive re-renders
8. **Test with getDiagnostics** - Ensure type safety

## Troubleshooting

### Shapes not rendering

- Check that `CanvasProvider` wraps your component
- Verify entity state in `shapes.shapes.entities`
- Check viewport `scale/translate` values

### Coordinate conversion issues

- Always use `screenToWorld` and `worldToScreen` utilities
- Ensure canvas ref is attached before coordinate conversions

### Selection not working

- Check that pointer events are not blocked by UI elements (use `pointer-events-auto` class)
- Verify hit testing thresholds are appropriate
- Check z-order (shapes rendered last are hit first)

### Performance issues

- Verify RAF throttling is working
- Check for unnecessary re-renders (React DevTools)
- Optimize shape rendering (use React.memo)
- Reduce point density for freehand paths

## Canvas Page Structure

The main canvas page (`app/dashboard/[projectId]/canvas/page.tsx`) follows this structure:

```tsx
<CanvasProvider>
  <CanvasContent>
    {/* Fixed UI overlays */}
    <Toolbar />
    <ZoomBar />
    <HistoryPill />

    {/* Canvas container with event handlers */}
    <div ref={attachCanvasRef} onPointerDown={...} className={cursorClass}>
      {/* Transformed inner container */}
      <div style={{ transform: `translate(...) scale(...)` }}>
        {/* Render all shapes */}
        {shapes.map((shape) => <ShapeComponent />)}

        {/* Render draft shapes (preview during drawing) */}
        {draftShape && <ShapePreview />}

        {/* Render freedraw preview */}
        {freeDrawPoints.length > 0 && <FreeDrawStrokePreview />}

        {/* Render selection box */}
        {selectionBox && <SelectionBox />}

        {/* Render bounding boxes for selected shapes */}
        {selectedShapes.map((id) => <BoundingBox />)}
      </div>
    </div>
  </CanvasContent>
</CanvasProvider>
```

**Key patterns:**

- Outer div handles pointer events and cursor
- Inner div applies viewport transform
- Shapes rendered in z-order (first = bottom, last = top)
- Draft shapes and UI overlays rendered on top
- Fixed UI elements use `pointer-events-auto` class

## Shape Components

Shape components are located in `shapes/` directory:

- Each shape type has its own folder (e.g., `shapes/rectangle/`)
- `index.tsx` - Main shape component
- `preview.tsx` - Preview component for draft shapes

**Shape component pattern:**

```tsx
export function Rectangle({ shape }: { shape: RectShape }) {
  return (
    <div
      className="absolute"
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.w,
        height: shape.h,
        border: `${shape.strokeWidth}px solid ${shape.stroke}`,
        backgroundColor: shape.fill || "transparent",
      }}
    />
  );
}
```

## Future Enhancements

- [ ] Undo/Redo with history tracking (UI ready, logic TODO)
- [ ] Collaborative editing via WebSocket
- [ ] Touch gesture support (pinch-to-zoom)
- [ ] Grid and shape snapping
- [ ] Layer management (z-index controls)
- [ ] Shape grouping
- [ ] Copy/paste functionality
- [ ] More keyboard shortcuts (Ctrl+A for select all, etc.)
- [ ] Export to image/SVG
- [ ] Performance monitoring and metrics
- [ ] Convex persistence (localStorage working, Convex TODO)
