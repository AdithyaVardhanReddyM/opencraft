# Design Document

## Overview

This design document outlines the implementation approach for improving canvas interaction behaviors and fixing critical bugs in the Unit {set} infinite canvas. The improvements focus on six key areas:

1. **Tool Auto-Switch**: Automatically return to select tool after completing drawing operations
2. **Correct Toolbar Icons**: Use hash icon for frame and square icon for rectangle
3. **Bounding Boxes**: Display visual selection indicators with resize handles around selected shapes
4. **Visual Refinements**: Reduce stroke thickness and use pale orange for draft shapes
5. **Selection Box**: Show a draggable selection area in select mode
6. **Keyboard Delete**: Enable Delete/Backspace keys to remove selected shapes

The design leverages the existing canvas architecture (React Context + useReducer) and extends it with new interaction patterns and visual components.

## Architecture

### Current Canvas Architecture

The canvas uses a layered architecture:

```
CanvasProvider (Context)
├── ViewportReducer (pan/zoom state)
├── ShapesReducer (shapes + selection state)
└── useInfiniteCanvas (interaction logic)
    └── Canvas Page (rendering)
```

### New Components and Modifications

```
useInfiniteCanvas (hook)
├── Selection Box State (new)
├── Keyboard Event Handlers (enhanced)
└── Tool Auto-Switch Logic (new)

Canvas Page (component)
├── BoundingBox Component (new)
├── SelectionBox Component (new)
└── Draft Shape Rendering (modified)

Toolbar Component (modified)
└── Icon Updates (frame → hash, rect → square)
```

## Components and Interfaces

### Existing Shape Components

The project already has shape component files in `/shapes` directory:

- `/shapes/frame/index.tsx` and `/shapes/frame/preview.tsx`
- `/shapes/rectangle/index.tsx` and `/shapes/rectangle/preview.tsx`
- `/shapes/elipse/index.tsx` and `/shapes/elipse/preview.tsx`
- `/shapes/line/index.tsx` and `/shapes/line/preview.tsx`
- `/shapes/arrow/index.tsx` and `/shapes/arrow/preview.tsx`
- `/shapes/stroke/index.tsx` and `/shapes/stroke/preview.tsx`
- `/shapes/text/index.tsx`

These components use absolute positioning with DIVs and SVGs, and should be used instead of inline SVG rendering in the canvas page.

**Note**: Some shape files reference `@/redux/slice/shapes` which doesn't exist. The implementation should update these imports to use `@/types/canvas` instead.

### 1. BoundingBox Component

A new component that renders visual selection indicators around selected shapes.

**Location**: `components/canvas/BoundingBox.tsx`

**Props**:

```typescript
interface BoundingBoxProps {
  shape: Shape;
  viewport: ViewportState;
  onResizeStart: (corner: ResizeCorner, bounds: Bounds) => void;
}

type ResizeCorner = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}
```

**Rendering Strategy**:

- Calculate bounding box from shape properties
- For rectangular shapes (frame, rect, ellipse, text, generatedui): use x, y, w, h
- For freedraw shapes: calculate min/max from points array
- For line/arrow shapes: calculate min/max from start/end coordinates
- Render as an SVG group with:
  - Border rectangle (2px stroke, pale orange color)
  - 8 resize handles for rectangular shapes (corners + midpoints)
  - 2 endpoint handles for line/arrow shapes
- Position handles at corners and edge midpoints
- Handle size: 8x8px squares, filled with white, bordered with pale orange

**Interaction**:

- Handles dispatch custom DOM events (`shape-resize-start`) when dragged
- Existing resize logic in `useInfiniteCanvas` handles the resize operations
- Handles have `pointer-events-auto` class to capture pointer events

### 2. SelectionBox Component

A new component that renders a temporary selection area when dragging in select mode.

**Location**: `components/canvas/SelectionBox.tsx`

**Props**:

```typescript
interface SelectionBoxProps {
  startWorld: Point;
  currentWorld: Point;
}
```

**Rendering**:

- Calculate rectangle from start and current points
- Render as SVG rect with:
  - Pale orange border (1.5px stroke)
  - Semi-transparent pale orange fill (opacity: 0.1)
  - No pointer events

**Usage**:

- Rendered conditionally when selection box is active
- Positioned in world coordinates (inside SVG transform)

### 3. Enhanced useInfiniteCanvas Hook

**New State**:

```typescript
// Selection box tracking
const selectionBoxRef = useRef<{ start: Point; current: Point } | null>(null);
const isSelectingRef = useRef(false);
```

**New Logic**:

**Selection Box Interaction**:

```typescript
// In onPointerDown (select mode, empty space):
if (currentTool === "select" && !hitShape && !e.shiftKey) {
  isSelectingRef.current = true;
  selectionBoxRef.current = { start: world, current: world };
  dispatchShapes({ type: "CLEAR_SELECTION" });
}

// In onPointerMove (selecting):
if (isSelectingRef.current && selectionBoxRef.current) {
  selectionBoxRef.current.current = world;
  requestRender();
}

// In onPointerUp (selecting):
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
```

**Tool Auto-Switch**:

```typescript
// In finalizeDrawingIfAny():
const finalizeDrawingIfAny = (): void => {
  if (!isDrawingRef.current) return;
  isDrawingRef.current = false;

  // ... existing finalization logic ...

  // Auto-switch to select tool after drawing
  if (currentTool !== "select" && currentTool !== "eraser") {
    dispatchShapes({ type: "SET_TOOL", payload: "select" });
  }

  requestRender();
};
```

**Keyboard Delete**:

```typescript
// In useEffect for keyboard handlers:
useEffect(() => {
  const onKeyDown = (e: KeyboardEvent): void => {
    // Existing shift key logic...

    // Delete/Backspace handling
    if (e.key === "Delete" || e.key === "Backspace") {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (!isInput && Object.keys(selectedShapes).length > 0) {
        e.preventDefault();
        dispatchShapes({ type: "DELETE_SELECTED" });
      }
    }
  };

  document.addEventListener("keydown", onKeyDown);
  // ... existing cleanup ...
}, [selectedShapes, dispatchShapes]);
```

**New Return Values**:

```typescript
return {
  // ... existing returns ...
  getSelectionBox: () => selectionBoxRef.current,
};
```

### 4. Updated Toolbar Component

**Location**: `components/canvas/Toolbar.tsx`

**Changes**:

```typescript
import { Hash, Square } from "lucide-react";

const TOOLS: ToolConfig[] = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "frame", icon: Hash, label: "Frame" }, // Changed from Square
  { id: "rect", icon: Square, label: "Rectangle" }, // Changed from RectangleHorizontal
  { id: "ellipse", icon: Circle, label: "Ellipse" },
  { id: "freedraw", icon: Pencil, label: "Pencil" },
  { id: "text", icon: Type, label: "Text" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
];
```

### 5. Updated Canvas Page

**Location**: `app/dashboard/[projectId]/canvas/page.tsx`

**Current Architecture Note**: The canvas page currently renders shapes directly in SVG. However, there are separate shape component files in `/shapes` directory that use absolute positioned DIVs/SVGs. The implementation should use these existing component files for consistency.

**Changes**:

**Import Shape Components**:

```typescript
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
```

**Replace SVG Rendering with Component Rendering**:

The canvas page should render shapes using the component files instead of inline SVG. This provides better separation of concerns and allows each shape to have its own rendering logic.

**Update Preview Components**:

All preview components in `/shapes/*/preview.tsx` need to be updated to use pale orange color and 1.5px stroke width:

```typescript
// In each preview component, change:
stroke="#666"          → stroke="hsl(24 95% 53%)"  // Pale orange (#f97316)
strokeWidth={2}        → strokeWidth={1.5}
```

**Bounding Box Rendering**:

```typescript
import { BoundingBox } from "@/components/canvas/BoundingBox";

// After rendering shapes, render bounding boxes
{
  Object.keys(selectedShapes).map((id) => {
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return null;

    return (
      <BoundingBox
        key={`bbox-${id}`}
        shape={shape}
        viewport={viewport}
        onResizeStart={(corner, bounds) => {
          // Dispatch custom event for resize
          window.dispatchEvent(
            new CustomEvent("shape-resize-start", {
              detail: { shapeId: id, corner, bounds },
            })
          );
        }}
      />
    );
  });
}
```

**Selection Box Rendering**:

```typescript
import { SelectionBox } from "@/components/canvas/SelectionBox";

const selectionBox = getSelectionBox();

// Render selection box if active
{
  selectionBox && (
    <SelectionBox
      startWorld={selectionBox.start}
      currentWorld={selectionBox.current}
    />
  );
}
```

## Data Models

### Selection Box State

```typescript
interface SelectionBoxState {
  start: Point; // Starting point in world coordinates
  current: Point; // Current point in world coordinates
}
```

Stored in a ref to avoid unnecessary re-renders during drag operations.

### Bounding Box Calculation

```typescript
interface BoundingBoxBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

function calculateBounds(shape: Shape): BoundingBoxBounds {
  switch (shape.type) {
    case "frame":
    case "rect":
    case "ellipse":
    case "text":
    case "generatedui":
      return { x: shape.x, y: shape.y, w: shape.w, h: shape.h };

    case "freedraw":
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

    case "arrow":
    case "line":
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
```

## Error Handling

### Keyboard Event Conflicts

**Problem**: Delete/Backspace keys should not trigger shape deletion when user is typing in an input field.

**Solution**: Check event target before handling keyboard shortcuts:

```typescript
const target = e.target as HTMLElement;
const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

if (!isInput) {
  // Handle keyboard shortcut
}
```

### Selection Box Edge Cases

**Problem**: Selection box might not correctly select shapes at viewport edges or with extreme zoom levels.

**Solution**:

- Use world coordinates for all calculations
- Implement robust intersection testing that accounts for shape bounds
- Test at various zoom levels (0.1x to 8x)

### Bounding Box Rendering Performance

**Problem**: Rendering bounding boxes for many selected shapes could impact performance.

**Solution**:

- Only render bounding boxes for selected shapes
- Use SVG primitives (rect, circle) instead of complex paths
- Leverage React's reconciliation to minimize DOM updates
- Consider using a single bounding box for multiple selections if performance is an issue

## Testing Strategy

### Unit Tests

**Not required for this spec** - Focus on integration and manual testing.

### Integration Tests

**Not required for this spec** - Focus on manual testing.

### Manual Testing Checklist

1. **Tool Auto-Switch**:

   - Draw each shape type (frame, rect, ellipse, line, arrow, freedraw)
   - Verify tool switches to select after each drawing operation
   - Verify text tool switches to select after placing text

2. **Toolbar Icons**:

   - Verify frame tool shows hash icon
   - Verify rectangle tool shows square icon
   - Verify all other icons are correct

3. **Bounding Boxes**:

   - Select each shape type individually
   - Verify bounding box appears with correct dimensions
   - Verify 8 resize handles for rectangular shapes
   - Verify 2 endpoint handles for line/arrow shapes
   - Test resizing from each handle
   - Select multiple shapes and verify bounding box encompasses all

4. **Visual Refinements**:

   - Draw draft shapes and verify pale orange color
   - Verify draft shapes have 1.5px stroke width
   - Verify finalized shapes use configured stroke width

5. **Selection Box**:

   - Drag in empty space in select mode
   - Verify selection box appears with pale orange styling
   - Verify shapes within box are selected on release
   - Test with shift key to add to selection

6. **Keyboard Delete**:

   - Select shapes and press Delete key
   - Select shapes and press Backspace key
   - Verify shapes are removed
   - Test in text input to ensure no interference

7. **Cross-Feature Testing**:
   - Test all features at various zoom levels
   - Test with multiple shapes selected
   - Test undo/redo after deletions (when implemented)
   - Test on different screen sizes

## Design System Integration

### Color Palette

**Pale Orange** (for draft shapes, selection box, bounding boxes):

- CSS Variable: `hsl(var(--chart-1))`
- Fallback: `#f97316` (orange-500)
- Usage: Draft shape strokes, selection box border/fill, bounding box border

**Primary Blue** (for active selections):

- CSS Variable: `hsl(var(--primary))`
- Fallback: `#3b82f6` (blue-500)
- Usage: Bounding box handles (optional, can use pale orange)

**Muted Gray** (for inactive elements):

- CSS Variable: `hsl(var(--muted))`
- Usage: Inactive toolbar buttons

### Stroke Widths

- Draft shapes: `1.5px`
- Default shapes: `2px`
- Selected shapes: Use shape's configured stroke width (don't override)
- Bounding boxes: `2px`
- Selection box: `1.5px`

### Opacity Values

- Selection box fill: `0.1` (10% opacity)
- Draft shapes: `1.0` (fully opaque)
- Bounding box: `1.0` (fully opaque)

## Implementation Notes

### Rendering Order

Shapes should be rendered in this order (bottom to top):

1. Finalized shapes (from shapes array)
2. Draft shape (if drawing)
3. Freedraw preview (if drawing)
4. Selection box (if selecting)
5. Bounding boxes (for selected shapes)

This ensures bounding boxes and selection UI are always visible on top.

### Performance Considerations

1. **RAF Throttling**: Selection box updates during drag should use existing RAF pattern
2. **Ref-Based State**: Selection box state uses refs to avoid re-renders
3. **Conditional Rendering**: Only render bounding boxes for selected shapes
4. **Event Delegation**: Keyboard events use document-level listeners (already implemented)

### Browser Compatibility

- All features use standard DOM APIs
- SVG rendering is widely supported
- Keyboard events work in all modern browsers
- Pointer events are used (better than mouse events for touch support)

### Accessibility

- Bounding box handles should have appropriate ARIA labels
- Keyboard shortcuts should be documented
- Selection state should be announced to screen readers (future enhancement)
- Focus management for keyboard navigation (future enhancement)

## Cursor Offset Fix

### Problem

The canvas applies a CSS transform (`translate` and `scale`) to the container div for pan and zoom functionality. However, the coordinate conversion in `useInfiniteCanvas` uses `getBoundingClientRect()` which returns the untransformed rectangle. This creates an offset between the cursor position and where shapes are drawn/selected.

### Root Cause

The current implementation:

1. Applies transform to the canvas container: `transform: translate(x, y) scale(s)`
2. Uses `getBoundingClientRect()` to get canvas position
3. Calculates local coordinates: `clientX - rect.left, clientY - rect.top`
4. Converts to world coordinates using `screenToWorld()`

The problem is that `getBoundingClientRect()` returns the original untransformed position, but the visual canvas is transformed. This causes a mismatch.

### Solution

The fix is to remove the transform from the canvas container and instead apply it to an inner SVG or group element. This way:

1. The canvas container remains untransformed
2. `getBoundingClientRect()` returns the correct visual position
3. The transform is applied only to the rendered content
4. Coordinate conversion works correctly

### Implementation

**Current Structure:**

```tsx
<div
  ref={attachCanvasRef}
  style={{
    transform: `translate(${viewport.translate.x}px, ${viewport.translate.y}px) scale(${viewport.scale})`,
    transformOrigin: "0 0",
  }}
>
  {/* shapes */}
</div>
```

**Fixed Structure:**

```tsx
<div ref={attachCanvasRef} className="h-full w-full">
  <div
    className="relative"
    style={{
      transform: `translate(${viewport.translate.x}px, ${viewport.translate.y}px) scale(${viewport.scale})`,
      transformOrigin: "0 0",
      width: "100%",
      height: "100%",
    }}
  >
    {/* shapes */}
  </div>
</div>
```

This separates the event-handling container from the transformed content container, ensuring accurate coordinate conversion.

## Future Enhancements

These are out of scope for this spec but noted for future consideration:

1. **Multi-Selection Bounding Box**: Show a single bounding box encompassing all selected shapes
2. **Rotation Handles**: Add rotation capability to bounding boxes
3. **Smart Guides**: Show alignment guides when moving shapes
4. **Selection Lasso**: Alternative selection method using freehand drawing
5. **Keyboard Shortcuts**: Additional shortcuts (Ctrl+A for select all, Ctrl+D for duplicate)
6. **Undo/Redo Integration**: Ensure all operations are undoable
7. **Selection Persistence**: Remember selection across tool switches
8. **Group Selection**: Ability to group shapes and manipulate as a unit
