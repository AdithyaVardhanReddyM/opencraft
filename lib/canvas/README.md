# Canvas State Management

This directory contains the complete implementation of the infinite canvas state management system for Unit {set}.

## Architecture

The canvas system uses **React Context + useReducer** for state management with a clean, Redux-free architecture.

### Core Components

1. **Types** (`types/canvas.ts`)

   - All TypeScript interfaces and types for shapes, viewport, and state

2. **Utilities** (`lib/canvas/`)

   - `coordinate-utils.ts` - Screen/world coordinate conversion and zoom calculations
   - `hit-testing.ts` - Shape intersection and hit detection
   - `entity-adapter.ts` - Normalized entity state management
   - `shape-factories.ts` - Shape creation with default styling
   - `history-manager.ts` - Undo/redo history management
   - `properties-utils.ts` - Property presets and controls
   - `autosave-utils.ts` - Save status and conflict resolution
   - `layers-sidebar-utils.ts` - Layer display utilities
   - `text-utils.ts` - Text measurement and dimensions
   - `cursor-utils.ts` - Cursor class mapping
   - `persistence.ts` - Canvas state serialization

3. **Reducers** (`lib/canvas/`)

   - `viewport-reducer.ts` - Viewport state (pan, zoom, mode)
   - `shapes-reducer.ts` - Shapes state (add, update, remove, select, history)

4. **Context** (`contexts/CanvasContext.tsx`)

   - React Context provider wrapping viewport and shapes state
   - Computed values (shapesList)
   - Default shape properties management

5. **Hooks** (`hooks/`)

   - `use-infinite-canvas.ts` - Main hook for canvas interactions
   - `use-canvas-persistence.ts` - State persistence (localStorage + Convex)
   - `use-canvas-cursor.ts` - Cursor management based on tool/mode
   - `use-autosave.ts` - Autosave hook with debouncing

6. **Components**
   - `app/dashboard/[projectId]/canvas/page.tsx` - Canvas page with rendering
   - `components/canvas/shapes/` - Shape rendering components
   - `components/canvas/property-controls/` - Property control components

## Features

### Viewport Management

- Pan with middle/right mouse button or Space + left mouse button
- Zoom with Ctrl/Cmd + wheel (zooms around cursor)
- Pan with wheel (horizontal/vertical)
- Zoom to fit all shapes
- Smooth performance with RAF optimization

### Shape Tools

- **Select** - Click to select, drag to move, Shift+click for multi-select, drag on empty for selection box
- **Hand** - Pan the canvas (also via Space key)
- **Frame** - Draw rectangular frames with auto-incrementing numbers
- **Rectangle** - Draw rectangles with optional border radius
- **Ellipse** - Draw ellipses
- **Freedraw** - Draw freehand paths with RAF-throttled rendering
- **Arrow** - Draw arrows with arrowheads
- **Line** - Draw straight lines
- **Text** - Click to place text with full typography controls
- **Screen** - AI-generated UI preview shapes
- **Eraser** - Click or drag to erase shapes

### Interaction Features

- Draft shape preview during drawing
- Multi-shape selection and movement
- Shape resizing via 8-point bounding box (corners + edges)
- Copy/paste with center-based positioning (Ctrl/Cmd+C/V)
- Undo/redo with history batching (Ctrl/Cmd+Z/Y)
- Keyboard shortcuts for all tools (S, H, F, R, C, L, A, D, T, E)
- Space key for temporary hand tool
- Double-click to edit text shapes
- Button click detection (prevents canvas interaction on UI buttons)
- Sidebar auto-open for text selection

### Shape Properties

- Stroke color (curated 10-color palette)
- Stroke width (thin/normal/thick)
- Stroke type (solid/dashed)
- Corner radius (sharp/rounded)
- Frame fill colors
- Text typography (font family, size, alignment, weight, style, decoration, line height, letter spacing, transform)
- Dimensions display

### Performance Optimizations

- RequestAnimationFrame throttling for freehand drawing (8ms interval)
- RAF-batched pan operations
- Refs for non-reactive state (no re-renders during interactions)
- Memoized computed values
- Immutable state updates with spread operators
- Normalized entity state for O(1) lookups
- History batching for move/resize operations

### State Persistence

- Auto-save to localStorage (1 second debounce)
- Auto-load from localStorage on mount
- Export/import as JSON
- Convex sync for cloud persistence
- History truncation for storage limits (20 entries persisted)

## File Reference

| File                      | Purpose                                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `coordinate-utils.ts`     | `screenToWorld`, `worldToScreen`, `zoomAroundScreenPoint`, `clamp`, `distance`, `midpoint`                                                     |
| `entity-adapter.ts`       | `createEntityState`, `addEntity`, `updateEntity`, `removeEntity`, `removeMany`, `removeAll`                                                    |
| `hit-testing.ts`          | `getShapeAtPoint`, `isPointInShape`, `distanceToLineSegment`                                                                                   |
| `shape-factories.ts`      | `createFrame`, `createRect`, `createEllipse`, `createFreeDraw`, `createArrow`, `createLine`, `createText`, `createScreen`, `createGeneratedUI` |
| `viewport-reducer.ts`     | Viewport actions: SET*TRANSLATE, SET_SCALE, ZOOM_IN/OUT, WHEEL_ZOOM/PAN, PAN_START/MOVE/END, HAND_TOOL*\*, CENTER_ON_WORLD, ZOOM_TO_FIT        |
| `shapes-reducer.ts`       | Shape actions: SET*TOOL, ADD*_, UPDATE*SHAPE, REMOVE_SHAPE, SELECT*_, DELETE_SELECTED, PASTE_SHAPES, UNDO, REDO, PUSH_HISTORY, LOAD_PROJECT    |
| `history-manager.ts`      | `createHistoryEntry`, `addToHistory`, `undo`, `redo`, `canUndo`, `canRedo`                                                                     |
| `properties-utils.ts`     | Stroke/corner/font presets, color palette, `getControlsForTool`, `getControlsForShapes`                                                        |
| `autosave-utils.ts`       | Save status types, `resolveConflict`, `deriveSaveStatus`, `calculateBackoffDelay`                                                              |
| `layers-sidebar-utils.ts` | `getShapeIcon`, `getShapeName`, `getShapeCenter`, `getShapeBounds`                                                                             |
| `text-utils.ts`           | `measureTextDimensions`, `getTextShapeDimensions`, `clampTextDimensions`, `getMinTextHeight`                                                   |
| `cursor-utils.ts`         | `getCursorForTool`, `getCursorForViewportMode`, `shouldShowGrabCursor`                                                                         |
| `persistence.ts`          | `serializeCanvasState`, `deserializeCanvasState`, `exportCanvasState`, `importCanvasState`, `saveToLocalStorage`, `loadFromLocalStorage`       |

## Usage

### Basic Setup

```tsx
import { CanvasProvider } from "@/contexts/CanvasContext";
import { useInfiniteCanvas } from "@/hooks/use-infinite-canvas";

function MyCanvas() {
  const {
    viewport,
    shapes,
    currentTool,
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
    getSelectionBox,
    zoomIn,
    zoomOut,
    zoomToFit,
    undo,
    redo,
  } = useInfiniteCanvas();

  return (
    <div
      ref={attachCanvasRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onDoubleClick={onDoubleClick}
    >
      {/* Render shapes */}
    </div>
  );
}

function App() {
  return (
    <CanvasProvider>
      <MyCanvas />
    </CanvasProvider>
  );
}
```

### With Persistence

```tsx
import { useCanvasPersistence } from "@/hooks/use-canvas-persistence";

function MyCanvas({ projectId }: { projectId: string }) {
  const { saveToConvex, loadFromConvex } = useCanvasPersistence(projectId);

  // Auto-saves to localStorage
  // Call saveToConvex() manually or on specific events
}
```

### Dispatching Actions

```tsx
import { useCanvasContext } from "@/contexts/CanvasContext";

function MyComponent() {
  const { dispatchViewport, dispatchShapes } = useCanvasContext();

  // Zoom in
  dispatchViewport({
    type: "ZOOM_BY",
    payload: { factor: 1.2, originScreen: { x: 0, y: 0 } },
  });

  // Add a rectangle
  dispatchShapes({
    type: "ADD_RECT",
    payload: { x: 100, y: 100, w: 200, h: 150 },
  });

  // Undo
  dispatchShapes({ type: "UNDO" });
}
```

## Constants

```typescript
// RAF throttling (use-infinite-canvas.ts)
RAF_INTERVAL_MS = 8;

// Hit testing thresholds (hit-testing.ts)
FREEDRAW_HIT_THRESHOLD = 5;
LINE_HIT_THRESHOLD = 8;
TEXT_PADDING = 8;
TEXT_BOUNDS_MARGIN = 2;

// Viewport constraints (viewport-reducer.ts)
MIN_SCALE = 0.1;
MAX_SCALE = 8;
WHEEL_PAN_SPEED = 2.0;
ZOOM_STEP = 1.05;

// Zoom sensitivity (use-infinite-canvas.ts)
TRACKPAD_SENSITIVITY = 0.25;
MOUSE_WHEEL_SENSITIVITY = 0.05;

// Shape defaults (shape-factories.ts)
SHAPE_DEFAULTS = { stroke: "#ffff", strokeWidth: 1 };

// Text defaults (text-utils.ts)
TEXT_PLACEHOLDER = "Type something...";
TEXT_MIN_WIDTH = 24;
TEXT_MAX_WIDTH = 1200;

// History configuration (history-manager.ts)
MAX_HISTORY_SIZE = 50;
PERSISTED_HISTORY_SIZE = 20;

// Autosave configuration (autosave-utils.ts)
LOCAL_SAVE_DEBOUNCE_MS = 1000;
CLOUD_SYNC_DEBOUNCE_MS = 2000;
MAX_RETRIES = 3;

// Properties (properties-utils.ts)
STROKE_WIDTH_MAP = { thin: 1, normal: 2, thick: 4 };
CORNER_RADIUS_MAP = { sharp: 0, rounded: 8 };
COLOR_PALETTE = [
  "#ffffff",
  "#a1a1aa",
  "#f87171",
  "#fb923c",
  "#facc15",
  "#4ade80",
  "#22d3ee",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
];

// Tool hotkeys (use-infinite-canvas.ts)
TOOL_HOTKEYS = {
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
```

## Keyboard Shortcuts

| Shortcut                      | Action                    |
| ----------------------------- | ------------------------- |
| Space                         | Temporary hand tool (pan) |
| Delete/Backspace              | Delete selected shapes    |
| Ctrl/Cmd+Z                    | Undo                      |
| Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y | Redo                      |
| Ctrl/Cmd+C                    | Copy selected shapes      |
| Ctrl/Cmd+V                    | Paste shapes at cursor    |
| S                             | Select tool               |
| H                             | Hand tool                 |
| F                             | Frame tool                |
| R                             | Rectangle tool            |
| C                             | Ellipse tool              |
| L                             | Line tool                 |
| A                             | Arrow tool                |
| D                             | Freedraw tool             |
| T                             | Text tool                 |
| E                             | Eraser tool               |

## Resize Events

The system uses custom DOM events for shape resizing:

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

## Testing

```bash
# Check for TypeScript errors
pnpm tsc --noEmit

# Run linting
pnpm lint
```

## Future Enhancements

- [ ] Collaborative editing via WebSocket
- [ ] Touch gesture support (pinch-to-zoom)
- [ ] Grid and shape snapping
- [ ] Layer management (z-index reordering)
- [ ] Shape grouping
- [ ] Duplicate functionality (Ctrl/Cmd+D)
- [ ] Export to image/SVG
- [ ] Shape alignment tools
- [ ] Guides and rulers
- [ ] Shape locking
