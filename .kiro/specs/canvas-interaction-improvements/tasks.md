# Implementation Plan

- [x] 1. Fix shape component imports and update preview components

  - Update all shape component files to use correct imports from `@/types/canvas` instead of `@/redux/slice/shapes`
  - Update all preview components to use pale orange color (hsl(24 95% 53%)) and 1.5px stroke width
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1_

- [x] 2. Update toolbar icons for frame and rectangle tools

  - Import Hash and Square icons from lucide-react in Toolbar component
  - Replace frame tool icon from Square to Hash
  - Replace rectangle tool icon from RectangleHorizontal to Square
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Implement tool auto-switch functionality

  - Modify `finalizeDrawingIfAny` function in useInfiniteCanvas hook to switch to select tool after drawing
  - Add tool switch logic for frame, rect, ellipse, arrow, line, and freedraw shapes
  - Ensure text tool already switches to select (verify existing behavior)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 4. Create BoundingBox component

  - Create new component at `components/canvas/BoundingBox.tsx`
  - Implement bounds calculation for all shape types (frame, rect, ellipse, freedraw, line, arrow, text)
  - Render bounding box border with pale orange color
  - Add 8 resize handles for rectangular shapes (corners + midpoints)
  - Add 2 endpoint handles for line/arrow shapes
  - Implement resize handle interaction with custom DOM events
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 5. Implement selection box functionality

  - Add selection box state refs to useInfiniteCanvas hook (selectionBoxRef, isSelectingRef)
  - Implement selection box start logic in onPointerDown (select mode, empty space)
  - Implement selection box update logic in onPointerMove
  - Implement selection box finalization in onPointerUp with shape intersection detection
  - Add getSelectionBox function to hook return values
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 6. Create SelectionBox component

  - Create new component at `components/canvas/SelectionBox.tsx`
  - Render selection box with pale orange border and semi-transparent fill
  - Use absolute positioning with world coordinates
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 7. Implement keyboard delete functionality

  - Add Delete and Backspace key handlers to useInfiniteCanvas keyboard event listener
  - Check if target is input/textarea before handling delete
  - Dispatch DELETE_SELECTED action when keys are pressed with shapes selected
  - Prevent default browser behavior for handled keys
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 8. Update canvas page to use shape components and render new UI elements

  - Import all shape components and preview components
  - Replace inline SVG shape rendering with shape component rendering
  - Import and render BoundingBox components for selected shapes
  - Import and render SelectionBox component when selection box is active
  - Ensure proper rendering order (shapes → draft → selection box → bounding boxes)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 9. Implement shape intersection detection for selection box

  - Create utility function to check if shape intersects with selection box
  - Handle intersection for all shape types (frame, rect, ellipse, freedraw, line, arrow, text)
  - Use bounding box approach for efficient intersection testing
  - _Requirements: 5.7, 10.3, 10.4_

- [x] 10. Test and refine all features

  - Test tool auto-switch for all drawing tools
  - Test toolbar icons display correctly
  - Test bounding boxes appear for all shape types
  - Test bounding box resize handles work correctly
  - Test selection box appears and selects shapes
  - Test keyboard delete removes selected shapes
  - Test at various zoom levels and screen sizes
  - Verify pale orange colors match design system
  - Verify stroke widths are correct (1.5px for drafts, 2px for shapes)
  - _Requirements: All requirements_

- [x] 11. Fix cursor offset issue by separating event container from transform container
  - Modify canvas page to use two-layer structure: outer event-handling div and inner transformed div
  - Move transform styles from outer canvas div to inner content div
  - Ensure all shapes, draft shapes, selection box, and bounding boxes render inside the transformed container
  - Verify coordinate conversion works correctly at all zoom levels
  - Test drawing shapes at various zoom levels to confirm cursor accuracy
  - Test selection box at various zoom levels to confirm cursor accuracy
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
