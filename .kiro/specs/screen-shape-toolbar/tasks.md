# Implementation Plan

- [x] 1. Create toolbar position utilities and device presets

  - [x] 1.1 Create `lib/canvas/toolbar-utils.ts` with device presets and position calculation
    - Define `DevicePreset` interface and `DEVICE_PRESETS` constant
    - Implement `calculateToolbarPosition` function for screen coordinate conversion
    - Export `TOOLBAR_GAP` constant (spacing between toolbar and shape)
    - _Requirements: 2.1, 8.1, 8.2, 8.3_
  - [ ]\* 1.2 Write property test for toolbar position calculation
    - **Property 7: Toolbar position follows viewport transform**
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 2. Create ScreenToolbar component structure

  - [x] 2.1 Create `components/canvas/ScreenToolbar.tsx` with basic layout
    - Implement toolbar container with rounded corners and shadow
    - Add device icon button, name input, preview/refresh/delete icons
    - Use Lucide icons: Monitor, Tablet, Smartphone, ExternalLink, RefreshCw, Trash2
    - Position toolbar using `calculateToolbarPosition` utility
    - _Requirements: 1.3, 1.4_
  - [ ]\* 2.2 Write property test for toolbar visibility
    - **Property 1: Toolbar visibility follows selection state**
    - **Validates: Requirements 1.1, 1.2**

- [x] 3. Implement device size dropdown

  - [x] 3.1 Add device dropdown using Popover component
    - Show dropdown on device icon click with three preset options
    - Display device icon and dimensions for each option
    - Close dropdown on selection
    - _Requirements: 2.1, 2.3, 2.4_
  - [x] 3.2 Implement shape resize on preset selection
    - Dispatch `UPDATE_SHAPE` action with new width/height
    - Maintain shape position (x, y unchanged)
    - _Requirements: 2.2_
  - [ ]\* 3.3 Write property test for device preset resize
    - **Property 2: Device preset resize correctness**
    - **Validates: Requirements 2.2**

- [x] 4. Implement editable screen name

  - [x] 4.1 Add name input field with edit mode
    - Display current screen title from Convex data
    - Enable editing on click
    - Save on Enter key or blur
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 4.2 Add name validation and save logic
    - Prevent saving empty or whitespace-only names
    - Restore previous name on validation failure
    - Show brief saving indicator during Convex mutation
    - Add Convex mutation call to update screen title
    - _Requirements: 3.4, 3.5_
  - [ ]\* 4.3 Write property test for name display
    - **Property 3: Name field displays current title**
    - **Validates: Requirements 3.1**
  - [ ]\* 4.4 Write property test for empty name validation
    - **Property 4: Empty name validation**
    - **Validates: Requirements 3.4**

- [x] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement preview functionality

  - [x] 6.1 Add preview button with sandbox state awareness
    - Use `useSandboxResume` hook for sandbox status
    - Open sandbox URL in new tab when status is "ready"
    - Wait for ready state if status is "resuming" or "checking"
    - Resume sandbox first if paused, then open URL
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 6.2 Add disabled state and tooltips for preview button
    - Disable when sandbox status is "expired" with tooltip
    - Disable when sandbox status is "idle" with tooltip
    - _Requirements: 4.4, 4.5_
  - [ ]\* 6.3 Write property test for preview button state
    - **Property 5: Preview button state based on sandbox status**
    - **Validates: Requirements 4.4, 4.5**

- [x] 7. Implement refresh functionality

  - [x] 7.1 Add refresh button with iframe reload
    - Trigger iframe reload when clicked and sandbox is ready
    - Use custom event or ref to communicate with Screen component
    - _Requirements: 5.1, 5.3_
  - [x] 7.2 Add disabled state for refresh button
    - Disable when sandbox status is not "ready"
    - _Requirements: 5.2_
  - [ ]\* 7.3 Write property test for refresh button state
    - **Property 6: Refresh button state based on sandbox status**
    - **Validates: Requirements 5.2**

- [x] 8. Implement delete functionality

  - [x] 8.1 Add delete button that triggers existing modal
    - Wire delete button to open `DeleteScreenModal`
    - Pass screen title and IDs to modal
    - Reuse existing delete confirmation flow
    - _Requirements: 6.1, 6.2_
  - [ ]\* 8.2 Write property test for delete cancellation
    - **Property 8: Delete cancellation preserves shape**
    - **Validates: Requirements 6.3**

- [x] 9. Add sandbox status indicators

  - [x] 9.1 Show loading state during sandbox resume
    - Display loading spinner when status is "resuming" or "checking"
    - Replace action icons with loading indicator
    - _Requirements: 7.1_
  - [x] 9.2 Show expired and error states
    - Display expired indicator when sandbox is expired
    - Show retry button for error state
    - _Requirements: 7.2, 7.3_

- [x] 10. Integrate ScreenToolbar into canvas page

  - [x] 10.1 Render ScreenToolbar for selected screen shapes
    - Add ScreenToolbar to canvas page render logic
    - Pass required props: shape, screenData, viewport, callbacks
    - Ensure toolbar renders outside transform container (fixed position)
    - _Requirements: 1.1, 1.2_
  - [x] 10.2 Wire up all toolbar callbacks
    - Connect onDelete to existing delete modal flow
    - Connect onResize to shape dispatch
    - Connect onRefresh to Screen component iframe
    - _Requirements: 2.2, 5.1, 6.1_

- [x] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
