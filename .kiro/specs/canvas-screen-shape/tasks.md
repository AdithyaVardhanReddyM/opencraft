# Implementation Plan

- [x] 1. Extend canvas types and shape factory

  - [x] 1.1 Add ScreenShape interface and update Tool/Shape types in `types/canvas.ts`
    - Add ScreenShape interface with type, x, y, w, h, screenId fields
    - Add "screen" to Tool union type
    - Add ScreenShape to Shape union type
    - _Requirements: 1.1, 2.1, 2.2_
  - [x] 1.2 Create screen shape factory in `lib/canvas/shape-factories.ts`
    - Add createScreen function with default dimensions 1440x1024
    - Generate unique shapeId using nanoid
    - _Requirements: 1.1_
  - [ ]\* 1.3 Write property test for screen creation dimensions
    - **Property 1: Screen creation with correct dimensions**
    - **Validates: Requirements 1.1**

- [x] 2. Update shapes reducer and hit testing

  - [x] 2.1 Add ADD_SCREEN action to shapes reducer in `lib/canvas/shapes-reducer.ts`
    - Handle ADD_SCREEN action to add screen shape to entity state
    - _Requirements: 1.1_
  - [x] 2.2 Update hit testing to handle Screen shapes in `lib/canvas/hit-testing.ts`
    - Add isPointInScreen function for rectangular hit detection
    - Update getShapeAtPoint to handle "screen" type
    - _Requirements: 2.1, 5.1, 5.2_
  - [x] 2.3 Add eraser exclusion for Screen shapes in `lib/canvas/hit-testing.ts`
    - Modify hit testing to skip Screen shapes when eraser tool is active
    - _Requirements: 5.1, 5.2_
  - [ ]\* 2.4 Write property test for eraser ignoring Screen shapes
    - **Property 14: Eraser ignores Screen shapes**
    - **Validates: Requirements 5.1, 5.2**

- [x] 3. Implement Screen resize with minimum constraints

  - [x] 3.1 Update resize logic in `hooks/use-infinite-canvas.ts` for Screen shapes
    - Handle Screen shape resizing with 320x240 minimum dimensions
    - _Requirements: 2.2, 2.3_
  - [ ]\* 3.2 Write property test for resize minimum enforcement
    - **Property 5: Screen resize respects minimum**
    - **Validates: Requirements 2.3**

- [x] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create Convex schema and functions

  - [x] 5.1 Add screens and messages tables to `convex/schema.ts`
    - Define screens table with shapeId, projectId, title, sandboxUrl, files, timestamps
    - Define messages table with screenId, role, content, createdAt
    - Add indexes for efficient queries
    - _Requirements: 7.1, 7.3_
  - [x] 5.2 Create `convex/screens.ts` with CRUD operations
    - Implement createScreen mutation
    - Implement updateScreen mutation
    - Implement deleteScreen mutation (with message cascade)
    - Implement getScreenByShapeId query
    - _Requirements: 7.1, 7.2, 7.4_
  - [x] 5.3 Create `convex/messages.ts` with message operations
    - Implement createMessage mutation
    - Implement getMessages query with ordering
    - Implement deleteMessagesByScreen mutation
    - _Requirements: 7.3, 7.4_
  - [ ]\* 5.4 Write property test for message association
    - **Property 7: Message association with screen**
    - **Validates: Requirements 3.3**
  - [ ]\* 5.5 Write property test for deletion cascade
    - **Property 15: Deletion cascade removes messages**
    - **Validates: Requirements 6.3, 7.4**

- [x] 6. Create Screen shape component

  - [x] 6.1 Create `components/canvas/shapes/Screen.tsx` component
    - Render browser-like chrome with title bar (traffic light dots)
    - Render iframe when sandboxUrl exists
    - Render empty state placeholder when no URL
    - Style with gradient background for empty state
    - _Requirements: 1.2, 1.3, 8.1, 8.3_
  - [x] 6.2 Create `components/canvas/shapes/ScreenPreview.tsx` for draft rendering
    - Simple preview rectangle during screen placement
    - _Requirements: 1.1_
  - [ ]\* 6.3 Write property test for empty state display
    - **Property 2: Empty state display**
    - **Validates: Requirements 1.2, 8.3**
  - [ ]\* 6.4 Write property test for iframe rendering
    - **Property 3: Iframe rendering with URL**
    - **Validates: Requirements 1.3**

- [x] 7. Add Screen tool to toolbar

  - [x] 7.1 Update `components/canvas/Toolbar.tsx` with Screen tool button
    - Add Screen tool config with Monitor icon and "W" shortcut
    - _Requirements: 1.1, 1.4_
  - [x] 7.2 Add "W" keyboard shortcut in `hooks/use-infinite-canvas.ts`
    - Add "w" to TOOL_HOTKEYS mapping to "screen"
    - _Requirements: 1.4_
  - [x] 7.3 Update cursor utils for screen tool in `lib/canvas/cursor-utils.ts`
    - Add cursor class for screen tool (crosshair)
    - _Requirements: 1.1_

- [x] 8. Implement Screen placement and interaction

  - [x] 8.1 Update `hooks/use-infinite-canvas.ts` for Screen tool interactions
    - Handle pointer down to place Screen at click position
    - Auto-switch to select tool after placement
    - Open sidebar when Screen is selected
    - _Requirements: 1.1, 3.1_
  - [x] 8.2 Update canvas page to render Screen shapes
    - Import and render Screen component for screen type shapes
    - Pass screen data from Convex query
    - _Requirements: 1.2, 1.3_
  - [ ]\* 8.3 Write property test for screen movement
    - **Property 4: Screen movement updates position**
    - **Validates: Requirements 2.1**

- [x] 9. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Create delete confirmation modal

  - [x] 10.1 Create `components/canvas/DeleteScreenModal.tsx`
    - Use AlertDialog from shadcn/ui
    - Display warning about deleting screen, messages, and data
    - Confirm and Cancel buttons
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 10.2 Integrate modal with delete flow in canvas
    - Show modal when deleting Screen shape
    - Call Convex deleteScreen on confirm
    - Close modal on cancel
    - _Requirements: 6.1, 6.3, 6.4_

- [x] 11. Update AI Sidebar for Screen context

  - [x] 11.1 Update `components/canvas/AISidebar.tsx` to accept selectedScreenId
    - Add selectedScreenId and projectId props
    - Query messages for selected screen using Convex
    - Display messages from query result
    - _Requirements: 3.2, 3.4_
  - [x] 11.2 Update message sending to include screenId
    - Pass screenId to API when sending messages
    - Create user message in Convex before API call
    - _Requirements: 3.3, 4.1_
  - [ ]\* 11.3 Write property test for thread switching
    - **Property 8: Thread switching on selection**
    - **Validates: Requirements 3.4**

- [x] 12. Update API route and Inngest workflow

  - [x] 12.1 Update `app/api/chat/route.ts` to require screenId
    - Add screenId and projectId to request schema
    - Pass screenId to Inngest event data
    - _Requirements: 4.1_
  - [x] 12.2 Update `inngest/functions.ts` to update Convex after workflow
    - Add step to update screen with sandboxUrl, files, title
    - Add step to create assistant message with summary
    - Handle isError case with error message
    - _Requirements: 4.3, 4.4, 4.6, 7.2_
  - [ ]\* 12.3 Write property test for workflow updates
    - **Property 10: Workflow updates screen in Convex**
    - **Validates: Requirements 4.3, 7.2**
  - [ ]\* 12.4 Write property test for summary message creation
    - **Property 11: Summary displayed as message**
    - **Validates: Requirements 4.4**

- [x] 13. Implement loading and error states

  - [x] 13.1 Add loading state to AI Sidebar during workflow processing
    - Show thinking indicator while waiting for response
    - Disable input during processing
    - _Requirements: 4.2_
  - [x] 13.2 Add error handling and display in AI Sidebar
    - Display error messages from failed workflows
    - Allow retry on error
    - _Requirements: 4.6_
  - [ ]\* 13.3 Write property test for error message display
    - **Property 13: Error message on workflow failure**
    - **Validates: Requirements 4.6**

- [x] 14. Update layers sidebar and properties utils

  - [x] 14.1 Update `lib/canvas/layers-sidebar-utils.ts` for Screen shapes
    - Add getShapeIcon case for "screen" type (Monitor icon)
    - Add getShapeName case for "screen" type
    - _Requirements: 8.1_
  - [x] 14.2 Update `lib/canvas/properties-utils.ts` to exclude Screen from properties
    - Return empty controls for Screen shapes (no properties bar)
    - _Requirements: 1.1_

- [x] 15. Final integration and polish

  - [x] 15.1 Wire up Screen creation to Convex
    - Call createScreen mutation when adding Screen shape
    - Store returned screenId in shape
    - _Requirements: 7.1_
  - [x] 15.2 Wire up iframe refresh on URL update
    - Use Convex reactive query to detect URL changes
    - Update iframe src when sandboxUrl changes
    - _Requirements: 4.5_
  - [ ]\* 15.3 Write property test for iframe refresh
    - **Property 12: Iframe refresh on URL update**
    - **Validates: Requirements 4.5**

- [ ] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
