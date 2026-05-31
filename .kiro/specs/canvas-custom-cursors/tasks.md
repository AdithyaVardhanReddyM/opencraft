# Implementation Plan

- [x] 1. Create SVG cursor definitions in CSS

  - Add custom cursor classes to `app/globals.css` with SVG data URIs
  - Define select cursor (black arrow with orange border)
  - Define pen cursor (pen icon with orange accent)
  - Define eraser cursor (eraser icon with red/pink colors)
  - Define cursor classes for crosshair, text, grab, and grabbing
  - Set appropriate hotspot coordinates for each cursor
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 7.1, 7.2, 7.3, 7.4, 7.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2. Create cursor utility module

  - Create `lib/canvas/cursor-utils.ts` file
  - Implement `getCursorForTool` function that maps Tool type to cursor class name
  - Implement `getCursorForViewportMode` function that returns cursor for panning states
  - Implement `shouldShowGrabCursor` function for Shift key logic
  - Export cursor mapping constants
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3. Implement useCanvasCursor hook

  - Create `hooks/use-canvas-cursor.ts` file
  - Import canvas context and cursor utilities
  - Add state for tracking Shift key press
  - Implement keyboard event listeners for Shift key (keydown/keyup)
  - Add effect to register and cleanup keyboard listeners
  - Implement cursor priority logic (panning > shift > tool)
  - Return cursor class name based on current state
  - Filter keyboard events to ignore input/textarea elements
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4. Integrate cursor hook into canvas page

  - Import `useCanvasCursor` hook in `app/dashboard/[projectId]/canvas/page.tsx`
  - Call hook in CanvasContent component to get cursor class
  - Remove hardcoded `cursor-crosshair` class from canvas container
  - Apply dynamic cursor class from hook to canvas container div
  - Test cursor changes with different tool selections
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3_

- [x] 5. Test and refine cursor designs
  - Manually test each cursor on the canvas
  - Verify select cursor displays with black fill and orange border
  - Verify pen cursor displays correctly for freedraw tool
  - Verify eraser cursor displays correctly for eraser tool
  - Verify crosshair displays for shape tools (frame, rect, ellipse, line, arrow)
  - Verify text cursor displays for text tool
  - Verify grab cursor displays when Shift key is held
  - Verify grabbing cursor displays during active panning
  - Test cursor visibility on different backgrounds
  - Adjust cursor hotspots if needed for accuracy
  - Test on high-DPI displays for crispness
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5, 10.1, 10.2, 10.3, 10.4, 10.5_
