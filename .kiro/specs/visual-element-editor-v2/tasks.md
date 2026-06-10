# Implementation Plan

- [x] 1. Extend type definitions and data models

  - [x] 1.1 Update ComputedStylesInfo in `lib/edit-mode/types.ts` with new properties (fontStyle, flexWrap, individual border radii, outline properties, backgroundImage)
    - Add fontStyle, flexWrap to existing interface
    - Add borderTopLeftRadius, borderTopRightRadius, borderBottomLeftRadius, borderBottomRightRadius
    - Add outlineWidth, outlineColor, outlineStyle, outlineOffset
    - Add backgroundImage property
    - Update COMPUTED_STYLE_KEYS array
    - _Requirements: 2.1, 3.3, 4.1, 4.2, 4.3, 4.4_
  - [x] 1.2 Extend SelectedElementInfo with unique identification fields
    - Add id, uniqueIdentifier, siblingIndex, dataAttributes, textContent fields
    - _Requirements: 6.4, 7.1_
  - [x] 1.3 Create element category utility types and functions
    - Create ElementCategory type ('container' | 'text' | 'image' | 'other')
    - Create getElementCategory function
    - Create TEXT_ELEMENTS and CONTAINER_ELEMENTS constants
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]\* 1.4 Write property test for element category classification
    - **Property 1: Section display based on element type**
    - **Validates: Requirements 1.1, 1.2**

- [x] 2. Update overlay script to capture enhanced element info

  - [x] 2.1 Modify getSelectedElementInfo in `lib/edit-mode/overlay-script.ts`
    - Capture element id attribute
    - Capture all data-\* attributes
    - Calculate siblingIndex among same-tag siblings
    - Generate uniqueIdentifier using id or data attributes or index
    - Capture textContent for text elements
    - _Requirements: 6.4, 7.1, 7.2_
  - [x] 2.2 Update getComputedStylesInfo to capture new style properties
    - Add fontStyle, flexWrap extraction
    - Add individual border radius extraction
    - Add outline properties extraction
    - Add backgroundImage extraction
    - _Requirements: 2.1, 3.3, 4.1, 4.3, 4.4_
  - [ ]\* 2.3 Write property test for style changes reflecting in DOM
    - **Property 2: Style changes reflect in DOM immediately**
    - **Validates: Requirements 2.5, 3.5, 4.7**

- [x] 3. Create unique selector generator

  - [x] 3.1 Create `lib/edit-mode/selector-generator.ts` with UniqueSelector interface and generateUniqueSelector function
    - Implement ID-based selector (highest priority)
    - Implement data-attribute-based selector
    - Implement nth-child path-based selector (fallback)
    - Return confidence level with selector
    - _Requirements: 6.1, 6.4, 7.3_
  - [x] 3.2 Create validateSelectorUniqueness utility function
    - Query document with selector
    - Return true only if exactly one element matches
    - _Requirements: 6.4, 7.3_
  - [ ]\* 3.3 Write property test for selector uniqueness
    - **Property 4: Persistence generates unique selectors**
    - **Validates: Requirements 6.1, 6.4**

- [x] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create LayoutSection component

  - [x] 5.1 Create `components/canvas/edit-mode/LayoutSection.tsx` with dimensions controls
    - Create DimensionInput component with unit dropdown (px, %, auto)
    - Add Width and Height inputs with tooltips
    - _Requirements: 2.1_
  - [x] 5.2 Add Mode toggle (Flex/None) with conditional rendering
    - Create LayoutModeToggle component
    - Show flex controls when mode is 'flex'
    - Show margin/padding when mode is 'none'
    - _Requirements: 2.2, 2.3, 2.4_
  - [x] 5.3 Implement Flex controls subsection
    - Add flex direction toggle (row/column arrows)
    - Add 9-point alignment grid for justify/align
    - Add gap input with icon
    - Add wrap checkbox
    - _Requirements: 2.3_
  - [x] 5.4 Implement Margin and Padding controls
    - Create SpacingInput component with 4 directional inputs
    - Add appropriate icons for each direction
    - _Requirements: 2.4_

- [x] 6. Create TypographySection component

  - [x] 6.1 Create `components/canvas/edit-mode/TypographySection.tsx` with text preview
    - Add collapsible text content preview area
    - Style preview to match reference image
    - _Requirements: 3.1_
  - [x] 6.2 Add text alignment and style controls
    - Create alignment button group (left, center, right icons)
    - Create style toggles (strikethrough, bold, italic icons)
    - _Requirements: 3.2_
  - [x] 6.3 Add font controls
    - Create FontFamilySelect with common web fonts
    - Create FontWeightSelect dropdown
    - Add fontSize input with icon
    - Add lineHeight input (percentage) with icon
    - Add letterSpacing input (percentage) with icon
    - _Requirements: 3.3_
  - [x] 6.4 Add text color control
    - Create ColorInput component with swatch and hex input
    - _Requirements: 3.4_

- [x] 7. Create AppearanceSection component

  - [x] 7.1 Create `components/canvas/edit-mode/AppearanceSection.tsx` with background controls
    - Add Solid/Gradient/Image tab switcher
    - Implement solid color picker with opacity
    - _Requirements: 4.1_
  - [x] 7.2 Add border controls
    - Add border style dropdown (solid/dashed/dotted)
    - Add border color picker
    - Add border width input
    - Add side selector (All dropdown or individual)
    - Add visibility toggle
    - _Requirements: 4.2_
  - [x] 7.3 Add outline controls
    - Add outline style dropdown
    - Add outline color picker with opacity
    - Add outline width input
    - Add outline offset input
    - Add remove button
    - _Requirements: 4.3_
  - [x] 7.4 Add radius controls
    - Add single radius input
    - Add toggle for per-corner controls
    - Add 4 corner inputs when expanded
    - _Requirements: 4.4_
  - [x] 7.5 Add shadow controls (drop shadow and inner shadow)
    - Create ShadowControl component with X, Y, blur, spread inputs
    - Add color picker with opacity
    - Add visibility toggle
    - Add add/remove buttons for multiple shadows
    - Parse and generate box-shadow CSS string
    - _Requirements: 4.5, 4.6_

- [x] 8. Create ImageSection component

  - [x] 8.1 Create `components/canvas/edit-mode/ImageSection.tsx`
    - Add URL input field
    - Add URL validation with error display
    - Add image preview thumbnail
    - _Requirements: 5.1, 5.2_
  - [ ]\* 8.2 Write property test for invalid URL handling
    - **Property 3: Invalid URL handling**
    - **Validates: Requirements 5.3**

- [x] 9. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update ElementPropertiesPanel to use new sections

  - [x] 10.1 Refactor `components/canvas/ElementPropertiesPanel.tsx` to use element categories
    - Import getElementCategory utility
    - Conditionally render sections based on category
    - Container: Layout + Appearance
    - Text: Layout + Typography + Appearance
    - Image: Layout + Appearance + ImageSection
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 10.2 Add modified state indicators
    - Show dot/marker next to modified properties
    - Track which properties have pending changes
    - _Requirements: 8.5_
  - [ ]\* 10.3 Write property test for modified state tracking
    - **Property 8: Modified state tracking**
    - **Validates: Requirements 8.5**

- [x] 11. Fix persistence bugs in useEditMode hook

  - [x] 11.1 Update saveChanges in `hooks/use-edit-mode.ts` to use unique selectors
    - Import generateUniqueSelector
    - Generate unique selector for selected element
    - Use selector to target specific element in source file
    - _Requirements: 6.1, 6.4, 7.3_
  - [x] 11.2 Update updateElementClassName in style-mapper to handle unique selectors
    - Accept unique selector parameter
    - Find element by unique selector in AST/source
    - Update only the matched element's className
    - _Requirements: 7.1, 7.2_
  - [ ]\* 11.3 Write property test for element isolation
    - **Property 7: Style changes target only selected element**
    - **Validates: Requirements 7.1, 7.3**

- [x] 12. Implement persistence round-trip verification

  - [x] 12.1 Add persistence verification in saveChanges
    - After writing file, verify changes were written correctly
    - Log warning if verification fails
    - _Requirements: 6.2_
  - [ ]\* 12.2 Write property test for persistence round-trip
    - **Property 5: Persistence survives reload**
    - **Validates: Requirements 6.2**
  - [ ]\* 12.3 Write property test for multiple element independence
    - **Property 6: Multiple element edits are independent**
    - **Validates: Requirements 6.3**

- [x] 13. Add UI polish and tooltips

  - [x] 13.1 Add tooltips to all icon buttons and controls
    - Use Tooltip component from shadcn/ui
    - Add descriptive tooltip text
    - _Requirements: 8.1_
  - [x] 13.2 Add smooth animations for section collapse/expand
    - Use framer-motion for height animations
    - Add subtle transitions
    - _Requirements: 8.4_
  - [x] 13.3 Ensure color pickers show swatch preview
    - Verify ColorInput component shows color swatch
    - _Requirements: 8.3_

- [x] 14. Export new components and update index files

  - [x] 14.1 Create `components/canvas/edit-mode/index.ts` barrel export
    - Export LayoutSection, TypographySection, AppearanceSection, ImageSection
    - _Requirements: N/A (code organization)_
  - [x] 14.2 Update `lib/edit-mode/index.ts` to export new utilities
    - Export generateUniqueSelector, validateSelectorUniqueness
    - Export getElementCategory
    - _Requirements: N/A (code organization)_

- [x] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
