# Requirements Document

## Introduction

This document specifies the requirements for an enhanced Visual Element Editor feature in Unit {set}. The editor allows users to select and modify DOM elements within the AI-generated sandbox preview through a comprehensive properties panel. The enhancement focuses on providing a professional, Figma-like editing experience with proper Layout, Typography, and Appearance sections that adapt based on the selected element type (div, text elements, images). Additionally, this update addresses critical bugs related to edit persistence and unintended style propagation.

## Glossary

- **Visual_Element_Editor**: The sidebar panel in the Edit tab that displays and allows modification of selected element properties
- **Sandbox_Preview**: The iframe displaying the AI-generated Next.js application
- **Element_Selector**: The CSS selector path used to uniquely identify a DOM element
- **Pending_Changes**: Style modifications that have been applied to the DOM but not yet persisted to source files
- **Layout_Mode**: The display mode of an element, either "flex" or "none" (block/other)
- **Typography_Section**: Properties panel section for text-related styles (font, size, weight, alignment, etc.)
- **Appearance_Section**: Properties panel section for visual styles (background, border, shadow, etc.)
- **Style_Persistence**: The process of saving style changes to the source file so they survive page reloads

## Requirements

### Requirement 1

**User Story:** As a user, I want to see different property sections based on the element type I select, so that I only see relevant editing options.

#### Acceptance Criteria

1. WHEN a user selects a div or container element THEN the Visual_Element_Editor SHALL display Layout and Appearance sections
2. WHEN a user selects a text element (h1, h2, h3, h4, h5, h6, p, span, label) THEN the Visual_Element_Editor SHALL display Layout, Typography, and Appearance sections
3. WHEN a user selects an img element THEN the Visual_Element_Editor SHALL display Layout, Appearance, and Image Source sections
4. WHEN no element is selected THEN the Visual_Element_Editor SHALL display an empty state with instructions

### Requirement 2

**User Story:** As a user, I want comprehensive layout controls, so that I can precisely position and size elements.

#### Acceptance Criteria

1. WHEN the Layout section is displayed THEN the Visual_Element_Editor SHALL show Width and Height input fields with unit dropdowns (px, %, auto)
2. WHEN the Layout section is displayed THEN the Visual_Element_Editor SHALL show a Mode toggle between "Flex" and "None"
3. WHEN Flex mode is selected THEN the Visual_Element_Editor SHALL display flex direction controls (row/column), alignment grid (9-point), gap input, and wrap toggle
4. WHEN None mode is selected THEN the Visual_Element_Editor SHALL display margin inputs (top, right, bottom, left) and padding inputs (top, right, bottom, left)
5. WHEN a user modifies any layout property THEN the Sandbox_Preview SHALL reflect the change immediately

### Requirement 3

**User Story:** As a user, I want comprehensive typography controls for text elements, so that I can style text precisely.

#### Acceptance Criteria

1. WHEN the Typography section is displayed THEN the Visual_Element_Editor SHALL show a text content preview area
2. WHEN the Typography section is displayed THEN the Visual_Element_Editor SHALL show text alignment buttons (left, center, right) and style toggles (bold, italic, strikethrough)
3. WHEN the Typography section is displayed THEN the Visual_Element_Editor SHALL show font family dropdown, font weight dropdown, font size input, line height input (percentage), and letter spacing input (percentage)
4. WHEN the Typography section is displayed THEN the Visual_Element_Editor SHALL show text color picker with hex input
5. WHEN a user modifies any typography property THEN the Sandbox_Preview SHALL reflect the change immediately

### Requirement 4

**User Story:** As a user, I want comprehensive appearance controls, so that I can style the visual presentation of elements.

#### Acceptance Criteria

1. WHEN the Appearance section is displayed THEN the Visual_Element_Editor SHALL show Background controls with Solid/Gradient/Image tabs, color picker, and opacity input
2. WHEN the Appearance section is displayed THEN the Visual_Element_Editor SHALL show Border controls with style dropdown (solid/dashed/dotted), color picker, width input, side selector (all/individual), and visibility toggle
3. WHEN the Appearance section is displayed THEN the Visual_Element_Editor SHALL show Outline controls with style dropdown, color picker, width input, offset input, and visibility toggle
4. WHEN the Appearance section is displayed THEN the Visual_Element_Editor SHALL show Radius input with optional per-corner controls
5. WHEN the Appearance section is displayed THEN the Visual_Element_Editor SHALL show Drop Shadow controls with X offset, Y offset, blur, spread, color picker, opacity, visibility toggle, and add/remove buttons for multiple shadows
6. WHEN the Appearance section is displayed THEN the Visual_Element_Editor SHALL show Inner Shadow controls with the same properties as Drop Shadow
7. WHEN a user modifies any appearance property THEN the Sandbox_Preview SHALL reflect the change immediately

### Requirement 5

**User Story:** As a user, I want to change image sources easily, so that I can update images without editing code.

#### Acceptance Criteria

1. WHEN an img element is selected THEN the Visual_Element_Editor SHALL display an Image Source section with a URL input field
2. WHEN a user enters a valid image URL THEN the Sandbox_Preview SHALL update the image source immediately
3. WHEN a user enters an invalid URL THEN the Visual_Element_Editor SHALL display a validation error without crashing

### Requirement 6

**User Story:** As a user, I want my edits to persist after page reload, so that I don't lose my work.

#### Acceptance Criteria

1. WHEN a user saves changes THEN the Visual_Element_Editor SHALL write the modified styles to the source file using unique Element_Selector identification
2. WHEN the sandbox page reloads THEN the Visual_Element_Editor SHALL preserve all previously saved style changes
3. WHEN multiple edits are made to different elements THEN the Visual_Element_Editor SHALL track and persist each element's changes independently
4. WHEN saving changes THEN the Visual_Element_Editor SHALL use the element's unique path (ID, data attributes, or nth-child selector) to target only the specific element

### Requirement 7

**User Story:** As a user, I want edits to apply only to the selected element, so that I don't accidentally change other elements.

#### Acceptance Criteria

1. WHEN a user modifies a style property THEN the Visual_Element_Editor SHALL apply the change only to the specifically selected element instance
2. WHEN elements share the same class or are in a loop/map THEN the Visual_Element_Editor SHALL modify only the selected instance by using unique identifiers
3. WHEN saving changes THEN the Visual_Element_Editor SHALL generate a unique selector that targets only the modified element

### Requirement 8

**User Story:** As a user, I want a professional and intuitive UI, so that the editing experience feels polished and efficient.

#### Acceptance Criteria

1. WHEN displaying property controls THEN the Visual_Element_Editor SHALL use appropriate icons with tooltips for all buttons and controls
2. WHEN displaying numeric inputs THEN the Visual_Element_Editor SHALL support keyboard increment/decrement and drag-to-adjust interactions
3. WHEN displaying color pickers THEN the Visual_Element_Editor SHALL show a color swatch preview alongside the hex input
4. WHEN sections are collapsible THEN the Visual_Element_Editor SHALL animate the expand/collapse transition smoothly
5. WHEN a property has been modified THEN the Visual_Element_Editor SHALL indicate the change with a visual marker
