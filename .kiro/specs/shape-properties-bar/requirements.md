# Requirements Document

## Introduction

This feature introduces a dynamic Shape Properties Bar that provides contextual controls for modifying shape properties on the canvas. The bar appears as a horizontal floating toolbar positioned beside a compact back button in the top-left corner. It dynamically updates its controls based on the currently selected tool or shape, allowing users to adjust stroke type, stroke width, color, and corner radius for applicable shapes.

## Glossary

- **Shape Properties Bar**: A horizontal floating toolbar that displays contextual property controls for the active tool or selected shape
- **Stroke Type**: The visual style of a shape's border - either solid (continuous line) or dashed (segmented line)
- **Stroke Width**: The thickness of a shape's border, offered in three presets: thin (1px), normal (2px), and thick (4px)
- **Corner Type**: The style of rectangle corners - either sharp (0px radius) or rounded (8px radius)
- **Color Palette**: A curated set of colors optimized for dark mode canvas aesthetics
- **Back Button**: A compact navigation button with arrow icon and tooltip for returning to the dashboard

## Requirements

### Requirement 1

**User Story:** As a user, I want a compact back button with a tooltip, so that I have more space for the properties bar while still being able to navigate to the dashboard.

#### Acceptance Criteria

1. WHEN the canvas page loads THEN the System SHALL display a compact arrow-only back button in the top-left corner
2. WHEN a user hovers over the back button THEN the System SHALL display a tooltip with the text "Back to Dashboard"
3. WHEN a user clicks the back button THEN the System SHALL navigate the user to the dashboard page

### Requirement 2

**User Story:** As a user, I want a shape properties bar that appears beside the back button, so that I can quickly access property controls for my shapes.

#### Acceptance Criteria

1. WHEN the canvas page loads THEN the System SHALL display a horizontal floating properties bar beside the back button
2. WHEN no tool requiring properties is active THEN the System SHALL display the properties bar in an empty or minimal state
3. WHEN a shape-drawing tool is selected THEN the System SHALL display relevant property controls for that tool type

### Requirement 3

**User Story:** As a user, I want to control stroke type for rectangle and ellipse shapes, so that I can create solid or dashed borders.

#### Acceptance Criteria

1. WHEN the rectangle or ellipse tool is selected THEN the System SHALL display a stroke type control with solid and dashed options
2. WHEN a user selects the solid stroke type THEN the System SHALL apply a continuous border style to new shapes
3. WHEN a user selects the dashed stroke type THEN the System SHALL apply a segmented border style to new shapes
4. WHEN a rectangle or ellipse shape is selected THEN the System SHALL display the stroke type control reflecting the shape's current stroke type

### Requirement 4

**User Story:** As a user, I want to control stroke width for rectangle and ellipse shapes, so that I can adjust border thickness.

#### Acceptance Criteria

1. WHEN the rectangle or ellipse tool is selected THEN the System SHALL display a stroke width control with thin, normal, and thick options
2. WHEN a user selects thin stroke width THEN the System SHALL set the stroke width to 1 pixel for new shapes
3. WHEN a user selects normal stroke width THEN the System SHALL set the stroke width to 2 pixels for new shapes
4. WHEN a user selects thick stroke width THEN the System SHALL set the stroke width to 4 pixels for new shapes
5. WHEN a rectangle or ellipse shape is selected THEN the System SHALL display the stroke width control reflecting the shape's current stroke width

### Requirement 5

**User Story:** As a user, I want to select colors from a curated palette for rectangle and ellipse shapes, so that my designs look cohesive with the canvas aesthetic.

#### Acceptance Criteria

1. WHEN the rectangle or ellipse tool is selected THEN the System SHALL display a color picker with a curated palette of dark-mode-friendly colors
2. WHEN a user selects a color from the palette THEN the System SHALL apply that color as the stroke color for new shapes
3. WHEN a rectangle or ellipse shape is selected THEN the System SHALL display the color picker reflecting the shape's current stroke color
4. THE System SHALL provide a minimum of 8 curated colors that complement the dark mode canvas aesthetic

### Requirement 6

**User Story:** As a user, I want to control corner type for rectangle shapes, so that I can create sharp or rounded corners.

#### Acceptance Criteria

1. WHEN the rectangle tool is selected THEN the System SHALL display a corner type control with sharp and rounded options
2. WHEN a user selects sharp corners THEN the System SHALL apply 0 pixel border radius to new rectangle shapes
3. WHEN a user selects rounded corners THEN the System SHALL apply 8 pixel border radius to new rectangle shapes
4. WHEN a rectangle shape is selected THEN the System SHALL display the corner type control reflecting the shape's current corner type
5. WHEN the ellipse tool is selected THEN the System SHALL NOT display the corner type control

### Requirement 7

**User Story:** As a user, I want to control stroke type and color for line, arrow, and freedraw shapes, so that I can customize their appearance.

#### Acceptance Criteria

1. WHEN the line, arrow, or freedraw tool is selected THEN the System SHALL display stroke type and color controls
2. WHEN a user modifies stroke type for line shapes THEN the System SHALL apply the selected stroke type to new line shapes
3. WHEN a user modifies color for line, arrow, or freedraw shapes THEN the System SHALL apply the selected color to new shapes
4. WHEN a line, arrow, or freedraw shape is selected THEN the System SHALL display controls reflecting the shape's current properties

### Requirement 8

**User Story:** As a user, I want property changes to apply to selected shapes immediately, so that I can see my modifications in real-time.

#### Acceptance Criteria

1. WHEN a shape is selected and a user changes a property value THEN the System SHALL update the selected shape immediately
2. WHEN multiple shapes are selected and a user changes a property value THEN the System SHALL update all selected shapes that support that property
3. WHEN a property is changed THEN the System SHALL record the change in the undo/redo history

### Requirement 9

**User Story:** As a user, I want the properties bar to have a clean, professional appearance that matches the canvas UI, so that the interface feels cohesive.

#### Acceptance Criteria

1. THE System SHALL style the properties bar with the same visual treatment as other canvas UI elements (backdrop blur, subtle shadows, border styling)
2. THE System SHALL use consistent spacing and sizing for all property controls
3. THE System SHALL provide clear visual feedback when controls are hovered or active
4. THE System SHALL use icons and minimal text to keep the bar compact and intuitive
