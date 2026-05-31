# Requirements Document

## Introduction

This document outlines the requirements for improving canvas interaction behaviors and fixing critical bugs in the Unit {set} infinite canvas. These improvements focus on tool switching, visual feedback, selection interactions, keyboard shortcuts, and design system consistency. The enhancements will provide a more polished, Figma-like experience with proper bounding boxes, selection boxes, and intuitive tool behaviors.

## Glossary

- **Canvas Interaction System**: The collection of behaviors and visual feedback mechanisms that enable users to interact with canvas shapes and tools
- **Bounding Box**: A visual rectangle with resize handles that appears around selected shapes, indicating selection state and enabling resize operations
- **Selection Box**: A temporary rectangular outline that appears when dragging in select mode, showing the area being selected
- **Draft Shape**: A temporary preview shape displayed while the user is actively drawing, before the shape is finalized
- **Tool Auto-Switch**: The behavior of automatically returning to the select tool after completing a drawing operation
- **Keyboard Delete**: The ability to remove selected shapes by pressing the Delete or Backspace key

## Requirements

### Requirement 1

**User Story:** As a user, I want the canvas to automatically switch to select tool after drawing a shape, so that I can immediately interact with what I just created

#### Acceptance Criteria

1. WHEN a user completes drawing a frame shape, THE Canvas Interaction System SHALL switch the active tool to select
2. WHEN a user completes drawing a rectangle shape, THE Canvas Interaction System SHALL switch the active tool to select
3. WHEN a user completes drawing an ellipse shape, THE Canvas Interaction System SHALL switch the active tool to select
4. WHEN a user completes drawing a line shape, THE Canvas Interaction System SHALL switch the active tool to select
5. WHEN a user completes drawing an arrow shape, THE Canvas Interaction System SHALL switch the active tool to select
6. WHEN a user completes a freedraw stroke, THE Canvas Interaction System SHALL switch the active tool to select
7. WHEN a user places a text shape, THE Canvas Interaction System SHALL switch the active tool to select

### Requirement 2

**User Story:** As a user, I want to see correct toolbar icons for frame and rectangle tools, so that I can easily identify each tool's purpose

#### Acceptance Criteria

1. WHEN the toolbar displays the frame tool button, THE Canvas Interaction System SHALL render a hash icon (grid/frame icon)
2. WHEN the toolbar displays the rectangle tool button, THE Canvas Interaction System SHALL render a square icon
3. WHEN tool icons are rendered, THE Canvas Interaction System SHALL use consistent icon sizing with other toolbar buttons
4. WHEN tool icons are rendered, THE Canvas Interaction System SHALL use icons from the Lucide React library

### Requirement 3

**User Story:** As a user, I want to see bounding boxes around selected shapes, so that I know which shapes are selected and can resize them

#### Acceptance Criteria

1. WHEN a frame shape is selected, THE Canvas Interaction System SHALL display a bounding box with eight resize handles around the frame
2. WHEN a rectangle shape is selected, THE Canvas Interaction System SHALL display a bounding box with eight resize handles around the rectangle
3. WHEN an ellipse shape is selected, THE Canvas Interaction System SHALL display a bounding box with eight resize handles around the ellipse
4. WHEN a line shape is selected, THE Canvas Interaction System SHALL display a bounding box with two endpoint handles
5. WHEN an arrow shape is selected, THE Canvas Interaction System SHALL display a bounding box with two endpoint handles
6. WHEN a text shape is selected, THE Canvas Interaction System SHALL display a bounding box with eight resize handles around the text
7. WHEN a freedraw shape is selected, THE Canvas Interaction System SHALL display a bounding box with eight resize handles around the stroke bounds
8. WHEN multiple shapes are selected, THE Canvas Interaction System SHALL display a bounding box encompassing all selected shapes
9. WHEN bounding boxes are rendered, THE Canvas Interaction System SHALL use a distinct color from the design system (e.g., primary or accent color)
10. WHEN resize handles are rendered, THE Canvas Interaction System SHALL display them as small squares or circles at bounding box corners and midpoints

### Requirement 4

**User Story:** As a user, I want draft shapes and finalized shapes to have appropriate stroke thickness, so that the canvas feels polished and professional

#### Acceptance Criteria

1. WHEN a draft shape is being drawn, THE Canvas Interaction System SHALL render the preview with a stroke width of 1.5 pixels
2. WHEN a finalized shape is rendered, THE Canvas Interaction System SHALL use the shape's configured stroke width property
3. WHEN a draft shape is being drawn, THE Canvas Interaction System SHALL render the preview with a pale orange color that matches the design system
4. WHEN draft shapes are rendered, THE Canvas Interaction System SHALL use a semi-transparent stroke to indicate temporary state
5. WHEN finalized shapes are rendered, THE Canvas Interaction System SHALL use fully opaque colors for clarity

### Requirement 5

**User Story:** As a user, I want to see a selection box when dragging in select mode, so that I can visually see which area I'm selecting

#### Acceptance Criteria

1. WHEN the user presses pointer down in select mode on empty canvas space, THE Canvas Interaction System SHALL begin tracking a selection box
2. WHEN the user moves the pointer while dragging in select mode, THE Canvas Interaction System SHALL display a rectangular selection box from the start point to the current pointer position
3. WHEN the selection box is displayed, THE Canvas Interaction System SHALL render it with a pale orange border matching the design system
4. WHEN the selection box is displayed, THE Canvas Interaction System SHALL render it with a semi-transparent pale orange fill
5. WHEN the user releases the pointer after dragging a selection box, THE Canvas Interaction System SHALL select all shapes that intersect or are contained within the selection box
6. WHEN the selection box operation completes, THE Canvas Interaction System SHALL remove the selection box visual
7. WHEN calculating shape intersection with selection box, THE Canvas Interaction System SHALL use the shape's bounding box for hit testing

### Requirement 6

**User Story:** As a user, I want to delete selected shapes using the keyboard, so that I can quickly remove unwanted elements

#### Acceptance Criteria

1. WHEN the user presses the Delete key with shapes selected, THE Canvas Interaction System SHALL remove all selected shapes from the canvas
2. WHEN the user presses the Backspace key with shapes selected, THE Canvas Interaction System SHALL remove all selected shapes from the canvas
3. WHEN shapes are deleted via keyboard, THE Canvas Interaction System SHALL clear the selection state
4. WHEN the Delete or Backspace key is pressed with no shapes selected, THE Canvas Interaction System SHALL take no action
5. WHEN keyboard delete is triggered, THE Canvas Interaction System SHALL prevent default browser behavior for the Delete and Backspace keys
6. WHEN shapes are deleted, THE Canvas Interaction System SHALL update the canvas state to reflect the removal

### Requirement 7

**User Story:** As a developer, I want shape rendering components to follow consistent patterns, so that all shapes behave predictably and maintainably

#### Acceptance Criteria

1. WHEN shape components are implemented, THE Canvas Interaction System SHALL use absolute positioning with world coordinates
2. WHEN shape components render borders, THE Canvas Interaction System SHALL use design system color variables
3. WHEN shape components are rendered, THE Canvas Interaction System SHALL include pointer-events-none class to prevent interference with canvas interactions
4. WHEN preview components are rendered, THE Canvas Interaction System SHALL use consistent styling patterns across all shape types
5. WHEN shape components receive style props, THE Canvas Interaction System SHALL apply them using inline styles for dynamic positioning

### Requirement 8

**User Story:** As a user, I want visual feedback to be consistent with the design system, so that the canvas feels integrated with the rest of the application

#### Acceptance Criteria

1. WHEN draft shapes are rendered, THE Canvas Interaction System SHALL use pale orange color (hsl(var(--chart-1)) or similar) from the design system
2. WHEN bounding boxes are rendered, THE Canvas Interaction System SHALL use primary or accent color from the design system
3. WHEN selection boxes are rendered, THE Canvas Interaction System SHALL use pale orange with appropriate opacity from the design system
4. WHEN hover states are displayed, THE Canvas Interaction System SHALL use muted colors from the design system
5. WHEN stroke widths are applied, THE Canvas Interaction System SHALL use consistent values (1.5px for previews, 2px for default shapes)

### Requirement 9

**User Story:** As a developer, I want proper event handling for keyboard interactions, so that keyboard shortcuts work reliably

#### Acceptance Criteria

1. WHEN the canvas component mounts, THE Canvas Interaction System SHALL register keydown event listeners for Delete and Backspace keys
2. WHEN the canvas component unmounts, THE Canvas Interaction System SHALL remove all keyboard event listeners
3. WHEN keyboard events are handled, THE Canvas Interaction System SHALL check if the target is an input or textarea element
4. WHEN the target is an input or textarea, THE Canvas Interaction System SHALL not trigger canvas keyboard shortcuts
5. WHEN keyboard events are processed, THE Canvas Interaction System SHALL prevent default browser behavior only for handled keys

### Requirement 10

**User Story:** As a user, I want selection interactions to feel natural and responsive, so that I can efficiently work with multiple shapes

#### Acceptance Criteria

1. WHEN the user clicks on a shape in select mode, THE Canvas Interaction System SHALL select only that shape and deselect others
2. WHEN the user shift-clicks on a shape, THE Canvas Interaction System SHALL toggle that shape's selection without affecting other selections
3. WHEN the user drags a selection box, THE Canvas Interaction System SHALL provide real-time visual feedback of the selection area
4. WHEN the user completes a selection box drag, THE Canvas Interaction System SHALL select all shapes within or intersecting the box
5. WHEN shapes are selected via selection box, THE Canvas Interaction System SHALL add them to the existing selection if shift key is held
6. WHEN shapes are selected via selection box without shift key, THE Canvas Interaction System SHALL replace the current selection

### Requirement 11

**User Story:** As a user, I want the cursor position to accurately match where shapes are drawn and selected, so that I can precisely interact with the canvas

#### Acceptance Criteria

1. WHEN the user clicks to start drawing a shape, THE Canvas Interaction System SHALL begin the shape at the exact cursor position
2. WHEN the user drags to draw a shape, THE Canvas Interaction System SHALL update the shape preview to follow the cursor exactly
3. WHEN the user drags a selection box, THE Canvas Interaction System SHALL render the selection box starting from the exact cursor position
4. WHEN the canvas is panned or zoomed, THE Canvas Interaction System SHALL maintain accurate cursor-to-world coordinate conversion
5. WHEN coordinate conversion is performed, THE Canvas Interaction System SHALL account for the canvas transform (translate and scale)
6. WHEN the user interacts with shapes at any zoom level, THE Canvas Interaction System SHALL maintain cursor accuracy within 1 pixel tolerance
