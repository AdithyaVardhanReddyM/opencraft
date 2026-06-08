# Implementation Plan

- [x] 1. Extend shape types and add utility functions

  - [x] 1.1 Add strokeType and borderRadius properties to shape types
    - Add `strokeType?: 'solid' | 'dashed'` to RectShape, EllipseShape, LineShape, ArrowShape, FreeDrawShape in `types/canvas.ts`
    - Add `borderRadius?: number` to RectShape in `types/canvas.ts`
    - _Requirements: 3.2, 3.3, 6.2, 6.3, 7.2_
  - [x] 1.2 Create properties utility functions
    - Create `lib/canvas/properties-utils.ts` with STROKE_WIDTH_MAP, CORNER_RADIUS_MAP, COLOR_PALETTE constants
    - Implement `strokeWidthToPixels`, `pixelsToStrokeWidth`, `cornerTypeToRadius`, `radiusToCornerType` functions
    - Implement `getControlsForTool` and `getControlsForShapes` functions
    - _Requirements: 4.2, 4.3, 4.4, 6.2, 6.3_
  - [ ]\* 1.3 Write property test for stroke width mapping
    - **Property 3: Stroke width preset mapping**
    - **Validates: Requirements 4.2, 4.3, 4.4**
  - [ ]\* 1.4 Write property test for corner type mapping
    - **Property 5: Corner type mapping for rectangles**
    - **Validates: Requirements 6.2, 6.3**

- [x] 2. Update shape factories and rendering

  - [x] 2.1 Update shape factories to accept new properties
    - Modify `createRect`, `createEllipse`, `createLine`, `createArrow`, `createFreeDraw` in `lib/canvas/shape-factories.ts`
    - Accept optional `strokeType` and `borderRadius` parameters
    - _Requirements: 3.2, 3.3, 6.2, 6.3, 7.2_
  - [x] 2.2 Update Rectangle component to render strokeType and borderRadius
    - Modify `components/canvas/shapes/Rectangle.tsx` to use `borderStyle` based on `strokeType`
    - Use `borderRadius` from shape instead of hardcoded value
    - _Requirements: 3.2, 3.3, 6.2, 6.3_
  - [x] 2.3 Update Ellipse component to render strokeType
    - Modify `components/canvas/shapes/Ellipse.tsx` to use `borderStyle` based on `strokeType`
    - _Requirements: 3.2, 3.3_
  - [x] 2.4 Update Line component to render strokeType
    - Modify `components/canvas/shapes/Line.tsx` to render dashed lines when applicable
    - _Requirements: 7.2_
  - [x] 2.5 Update Arrow and Stroke components to render strokeType
    - Modify `components/canvas/shapes/Arrow.tsx` and `components/canvas/shapes/Stroke.tsx`
    - _Requirements: 7.2, 7.3_
  - [ ]\* 2.6 Write property test for stroke type application
    - **Property 2: Stroke type application consistency**
    - **Validates: Requirements 3.2, 3.3, 7.2**

- [x] 3. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create property control components

  - [x] 4.1 Create StrokeTypeControl component
    - Create `components/canvas/property-controls/StrokeTypeControl.tsx`
    - Toggle button group with solid/dashed icons
    - _Requirements: 3.1, 7.1_
  - [x] 4.2 Create StrokeWidthControl component
    - Create `components/canvas/property-controls/StrokeWidthControl.tsx`
    - Three-option button group for thin/normal/thick
    - _Requirements: 4.1_
  - [x] 4.3 Create ColorPicker component
    - Create `components/canvas/property-controls/ColorPicker.tsx`
    - Popover with color swatches from COLOR_PALETTE
    - Show current color indicator
    - _Requirements: 5.1, 5.4_
  - [x] 4.4 Create CornerTypeControl component
    - Create `components/canvas/property-controls/CornerTypeControl.tsx`
    - Toggle button group with sharp/rounded icons
    - _Requirements: 6.1_
  - [x] 4.5 Create index export file for property controls
    - Create `components/canvas/property-controls/index.ts`
    - Export all control components
    - _Requirements: 2.3_

- [x] 5. Update BackButton to compact style with tooltip

  - [x] 5.1 Modify BackButton component
    - Remove text label from button
    - Add Tooltip wrapper with "Back to Dashboard" text
    - Reduce button size for compact appearance
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 6. Create ShapePropertiesBar component

  - [x] 6.1 Create main ShapePropertiesBar component
    - Create `components/canvas/ShapePropertiesBar.tsx`
    - Accept currentTool, selectedShapes, defaultProperties, onPropertyChange, onDefaultChange props
    - Render controls based on tool/selection using getControlsForTool/getControlsForShapes
    - Style with backdrop blur, shadows matching canvas UI
    - _Requirements: 2.1, 2.2, 2.3, 9.1, 9.2, 9.3, 9.4_
  - [ ]\* 6.2 Write property test for tool-based control visibility
    - **Property 1: Tool-based control visibility**
    - **Validates: Requirements 2.2, 2.3, 3.1, 4.1, 5.1, 6.1, 6.5, 7.1**

- [x] 7. Integrate properties bar with canvas context

  - [x] 7.1 Add default properties state to CanvasContext
    - Add `defaultProperties` state to `contexts/CanvasContext.tsx`
    - Add `setDefaultProperty` function to update defaults
    - _Requirements: 3.2, 3.3, 4.2, 4.3, 4.4, 5.2, 6.2, 6.3, 7.2, 7.3_
  - [x] 7.2 Update shape creation to use default properties
    - Modify `use-infinite-canvas.ts` to pass default properties when creating shapes
    - Apply strokeType, strokeWidth, strokeColor, borderRadius from defaults
    - _Requirements: 3.2, 3.3, 4.2, 4.3, 4.4, 5.2, 6.2, 6.3, 7.2, 7.3_
  - [ ]\* 7.3 Write property test for color application
    - **Property 4: Color application consistency**
    - **Validates: Requirements 5.2, 7.3**

- [x] 8. Implement selected shape property updates

  - [x] 8.1 Add property update handlers to canvas page
    - Implement `handlePropertyChange` in canvas page to dispatch UPDATE_SHAPE
    - Handle single and multi-shape selection
    - _Requirements: 8.1, 8.2_
  - [x] 8.2 Ensure property changes are recorded in history
    - Verify UPDATE_SHAPE action records to history (already implemented in reducer)
    - _Requirements: 8.3_
  - [ ]\* 8.3 Write property test for real-time shape updates
    - **Property 7: Real-time shape updates**
    - **Validates: Requirements 8.1**
  - [ ]\* 8.4 Write property test for multi-shape batch updates
    - **Property 8: Multi-shape batch updates**
    - **Validates: Requirements 8.2**
  - [ ]\* 8.5 Write property test for history integration
    - **Property 9: History integration**
    - **Validates: Requirements 8.3**

- [x] 9. Implement UI reflection of selected shape properties

  - [x] 9.1 Add logic to read properties from selected shapes
    - In ShapePropertiesBar, compute displayed values from selected shapes
    - Handle mixed values (multiple shapes with different values)
    - _Requirements: 3.4, 4.5, 5.3, 6.4, 7.4_
  - [ ]\* 9.2 Write property test for selected shape property reflection
    - **Property 6: Selected shape property reflection**
    - **Validates: Requirements 3.4, 4.5, 5.3, 6.4, 7.4**

- [x] 10. Integrate ShapePropertiesBar into canvas page

  - [x] 10.1 Add ShapePropertiesBar to canvas page layout
    - Import and render ShapePropertiesBar in `app/dashboard/[projectId]/canvas/page.tsx`
    - Position beside BackButton in top-left container
    - Wire up props: currentTool, selectedShapes, defaultProperties, handlers
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 11. Verify undo/redo and autosave functionality

  - [x] 11.1 Verify undo/redo works with new shape properties
    - Test that property changes (strokeType, strokeWidth, color, borderRadius) are properly recorded in history
    - Verify Ctrl/Cmd+Z undoes property changes and restores previous values
    - Verify Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redoes property changes
    - _Requirements: 8.3_
  - [x] 11.2 Verify autosave persists new shape properties
    - Ensure new properties (strokeType, borderRadius) are included in `serializeCanvasState` in `lib/canvas/persistence.ts`
    - Verify shapes with new properties save to localStorage correctly
    - Verify shapes with new properties load from localStorage correctly
    - Test that Convex sync (if implemented) includes new properties
    - _Requirements: 8.3_

- [x] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
