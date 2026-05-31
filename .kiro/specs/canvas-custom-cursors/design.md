# Design Document

## Overview

The Canvas Custom Cursors feature enhances the user experience by providing tool-specific cursor styles that match the Unit {set} design theme. The system will dynamically update cursor styles based on the active tool and interaction state, using SVG-based custom cursors for crisp rendering across all display densities.

The implementation will integrate with the existing canvas context and viewport state management, applying cursor styles to the canvas container element. Custom cursors will be defined using CSS with SVG data URIs for optimal performance and scalability.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Canvas Page                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Canvas Container (div)                    │  │
│  │         - Cursor style applied here               │  │
│  │         - Responds to tool changes                │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │    Transformed Inner Container              │  │  │
│  │  │    - Shapes rendered here                   │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │   useCanvasCursor Hook              │
        │   - Monitors tool state             │
        │   - Monitors viewport mode          │
        │   - Monitors keyboard modifiers     │
        │   - Returns cursor class name       │
        └─────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │   Cursor Definitions (CSS)          │
        │   - SVG data URIs                   │
        │   - Cursor classes                  │
        │   - Hotspot coordinates             │
        └─────────────────────────────────────┘
```

### Component Integration

The cursor system integrates with existing components:

1. **Canvas Page** (`app/dashboard/[projectId]/canvas/page.tsx`)

   - Applies cursor class to canvas container
   - Uses `useCanvasCursor` hook to determine cursor

2. **Canvas Context** (`contexts/CanvasContext.tsx`)

   - Provides tool state
   - Provides viewport mode state

3. **Viewport Reducer** (`lib/canvas/viewport-reducer.ts`)
   - Manages panning modes
   - Provides viewport mode for cursor decisions

## Components and Interfaces

### 1. Custom Hook: `useCanvasCursor`

**Location**: `hooks/use-canvas-cursor.ts`

**Purpose**: Centralized cursor management logic that determines the appropriate cursor based on tool state, viewport mode, and keyboard modifiers.

**Interface**:

```typescript
interface UseCanvasCursorReturn {
  cursorClass: string;
}

function useCanvasCursor(): UseCanvasCursorReturn;
```

**Logic Flow**:

```
1. Read current tool from canvas context
2. Read viewport mode from canvas context
3. Listen for Shift key state
4. Determine cursor priority:
   a. If viewport.mode === "panning" or "shiftPanning" → grabbing cursor
   b. Else if Shift key is held → grab cursor
   c. Else return cursor for current tool
5. Return appropriate cursor class name
```

**Implementation Details**:

- Use `useCanvasContext()` to access tool and viewport state
- Use `useEffect` to listen for keyboard events (keydown/keyup for Shift)
- Use `useState` to track Shift key state
- Return cursor class name that corresponds to CSS cursor definitions
- Clean up keyboard listeners on unmount

### 2. CSS Cursor Definitions

**Location**: `app/globals.css` (or new file `lib/canvas/cursors.css`)

**Purpose**: Define custom cursor styles using SVG data URIs for all tools.

**Cursor Definitions**:

#### Select Cursor (Custom Black with Orange Border)

```css
.cursor-select {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M5 3 L5 17 L9 13 L12 19 L14 18 L11 12 L17 12 Z" fill="black" stroke="%23f97316" stroke-width="1.5"/></svg>')
      2 2, auto;
}
```

#### Pen/Freedraw Cursor

```css
.cursor-pen {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M15 2 L18 5 L7 16 L3 17 L4 13 Z" fill="none" stroke="black" stroke-width="1.5"/><circle cx="16.5" cy="3.5" r="1.5" fill="%23f97316"/></svg>')
      2 18, auto;
}
```

#### Eraser Cursor

```css
.cursor-eraser {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><rect x="2" y="8" width="12" height="8" rx="1" fill="%23ef4444" stroke="black" stroke-width="1"/><path d="M14 8 L18 4 L16 2 L12 6 Z" fill="%23fca5a5" stroke="black" stroke-width="1"/></svg>')
      10 10, auto;
}
```

#### Crosshair Cursor (Shape Tools)

```css
.cursor-crosshair {
  cursor: crosshair;
}
```

#### Text Cursor

```css
.cursor-text {
  cursor: text;
}
```

#### Grab Cursor (Shift Key)

```css
.cursor-grab {
  cursor: grab;
}
```

#### Grabbing Cursor (Active Panning)

```css
.cursor-grabbing {
  cursor: grabbing;
}
```

### 3. Cursor Utility Module (Optional)

**Location**: `lib/canvas/cursor-utils.ts`

**Purpose**: Helper functions for cursor management if needed for complex logic.

**Interface**:

```typescript
export function getCursorForTool(tool: Tool): string;
export function getCursorForViewportMode(mode: ViewportMode): string | null;
export function shouldShowGrabCursor(
  isShiftPressed: boolean,
  mode: ViewportMode
): boolean;
```

## Data Models

### Cursor State

The cursor state is derived from existing data models:

```typescript
// From types/canvas.ts
type Tool =
  | "select"
  | "frame"
  | "rect"
  | "ellipse"
  | "freedraw"
  | "arrow"
  | "line"
  | "text"
  | "eraser";
type ViewportMode = "idle" | "panning" | "shiftPanning";

// New type for cursor management
type CursorClass =
  | "cursor-select"
  | "cursor-pen"
  | "cursor-eraser"
  | "cursor-crosshair"
  | "cursor-text"
  | "cursor-grab"
  | "cursor-grabbing";
```

### Tool to Cursor Mapping

```typescript
const TOOL_CURSOR_MAP: Record<Tool, CursorClass> = {
  select: "cursor-select",
  frame: "cursor-crosshair",
  rect: "cursor-crosshair",
  ellipse: "cursor-crosshair",
  freedraw: "cursor-pen",
  arrow: "cursor-crosshair",
  line: "cursor-crosshair",
  text: "cursor-text",
  eraser: "cursor-eraser",
};
```

## Error Handling

### Fallback Cursors

All custom cursor definitions include fallback values:

```css
cursor: url("...") x y, auto;
```

If the SVG data URI fails to load or render, the browser will fall back to the default `auto` cursor.

### Browser Compatibility

- **Modern Browsers**: Full support for SVG data URI cursors
- **Older Browsers**: Automatic fallback to system cursors
- **Size Limits**: Keep SVG cursors under 128x128 pixels for maximum compatibility

### Error Scenarios

1. **Invalid SVG**: Browser falls back to `auto` cursor
2. **Missing Context**: Hook throws error (caught by error boundary)
3. **Keyboard Event Conflicts**: Check event target to avoid interfering with input fields

## Testing Strategy

### Unit Tests

**File**: `hooks/__tests__/use-canvas-cursor.test.ts`

Test cases:

1. Returns correct cursor class for each tool
2. Returns grab cursor when Shift is pressed
3. Returns grabbing cursor when viewport mode is panning
4. Prioritizes panning cursor over tool cursor
5. Cleans up keyboard listeners on unmount
6. Handles rapid tool changes correctly

### Integration Tests

**File**: `app/dashboard/[projectId]/canvas/__tests__/cursor-integration.test.tsx`

Test cases:

1. Cursor changes when tool is selected from toolbar
2. Cursor changes to grab when Shift is pressed
3. Cursor changes to grabbing during pan operation
4. Cursor restores to tool cursor after panning
5. Cursor updates immediately without delay

### Visual Tests

Manual testing checklist:

- [ ] Select cursor displays with black fill and orange border
- [ ] Pen cursor displays with pen icon
- [ ] Eraser cursor displays with eraser icon
- [ ] Crosshair cursor displays for shape tools
- [ ] Text cursor displays for text tool
- [ ] Grab cursor displays when Shift is held
- [ ] Grabbing cursor displays during pan
- [ ] Cursors are crisp on high-DPI displays
- [ ] Cursor hotspots are accurate for each tool
- [ ] Cursors are visible on both light and dark backgrounds

### Performance Tests

- Measure cursor update latency (should be < 16ms)
- Verify no memory leaks from keyboard listeners
- Confirm smooth cursor transitions without flicker

## Implementation Plan

### Phase 1: CSS Cursor Definitions

1. Create SVG designs for custom cursors
2. Convert SVGs to data URIs
3. Add cursor classes to `globals.css`
4. Test cursor rendering in isolation

### Phase 2: Hook Implementation

1. Create `useCanvasCursor` hook
2. Implement tool-to-cursor mapping logic
3. Add Shift key detection
4. Add viewport mode detection
5. Test hook with mock context

### Phase 3: Integration

1. Import hook in canvas page
2. Apply cursor class to canvas container
3. Remove hardcoded `cursor-crosshair` class
4. Test cursor changes with tool selection
5. Test cursor changes with panning

### Phase 4: Polish and Testing

1. Fine-tune cursor hotspots
2. Adjust cursor designs for visibility
3. Add comprehensive tests
4. Perform cross-browser testing
5. Test on high-DPI displays

## Design Decisions and Rationales

### Decision 1: SVG Data URIs vs Image Files

**Choice**: Use SVG data URIs embedded in CSS

**Rationale**:

- No additional HTTP requests
- Scalable for high-DPI displays
- Easy to modify colors and shapes
- Inline in CSS for better performance
- No build step required

**Alternatives Considered**:

- PNG/ICO files: Not scalable, requires multiple sizes
- External SVG files: Additional HTTP requests
- Canvas-rendered cursors: Complex, performance overhead

### Decision 2: Hook-Based vs Component-Based

**Choice**: Use custom hook (`useCanvasCursor`)

**Rationale**:

- Separates cursor logic from rendering
- Reusable across components if needed
- Easier to test in isolation
- Follows React best practices
- Keeps canvas page component clean

**Alternatives Considered**:

- Inline logic in canvas page: Less maintainable
- Separate cursor component: Unnecessary complexity
- Context-based: Overkill for simple state

### Decision 3: CSS Classes vs Inline Styles

**Choice**: Use CSS classes for cursor definitions

**Rationale**:

- Better performance (no style recalculation)
- Easier to maintain and update
- Can be themed or customized
- Follows existing codebase patterns
- Better browser caching

**Alternatives Considered**:

- Inline styles: Harder to maintain, no caching
- JavaScript-generated cursors: Unnecessary complexity

### Decision 4: Cursor Priority Order

**Choice**: Panning > Shift Key > Tool Cursor

**Rationale**:

- Active interactions take precedence
- Modifier keys override tool cursors
- Matches user expectations
- Consistent with Figma and other design tools

### Decision 5: Keyboard Event Handling

**Choice**: Global keyboard listeners in hook with cleanup

**Rationale**:

- Detects Shift key regardless of focus
- Proper cleanup prevents memory leaks
- Filters out input/textarea events
- Simple and performant

**Alternatives Considered**:

- Canvas-only listeners: Misses Shift press outside canvas
- Context-based keyboard state: Unnecessary complexity

## Accessibility Considerations

1. **Cursor Visibility**: All custom cursors have sufficient contrast
2. **Fallback Support**: System cursors available if custom cursors fail
3. **Keyboard Navigation**: Cursor changes don't interfere with keyboard shortcuts
4. **Screen Readers**: Cursor changes are visual only, don't affect screen reader behavior
5. **High Contrast Mode**: System cursors used in high contrast mode

## Performance Considerations

1. **Cursor Updates**: Use CSS classes to avoid style recalculation
2. **Event Listeners**: Single keyboard listener with proper cleanup
3. **Re-renders**: Hook only triggers re-render when cursor actually changes
4. **Memory**: SVG data URIs are small (<2KB each)
5. **Browser Caching**: CSS-based cursors are cached by browser

## Future Enhancements

1. **Animated Cursors**: Add subtle animations for certain tools
2. **Cursor Size Options**: Allow users to choose cursor size
3. **Custom Cursor Colors**: Theme-based cursor colors
4. **Cursor Trails**: Optional cursor trail effect for drawing tools
5. **Cursor Tooltips**: Show tool name near cursor on hover
