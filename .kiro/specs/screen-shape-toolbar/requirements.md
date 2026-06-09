# Requirements Document

## Introduction

This feature adds a floating toolbar above selected screen shapes on the canvas. The toolbar provides quick access to device size presets, screen name editing, preview in new tab, refresh iframe, and delete functionality. The toolbar also includes sandbox state awareness to handle paused/expired sandboxes appropriately.

## Glossary

- **Screen Shape**: A canvas shape that displays an AI-generated UI preview in an iframe, linked to a Convex screen record
- **Screen Toolbar**: A floating bar that appears above a selected screen shape with action icons
- **Sandbox**: An E2B isolated execution environment that runs the generated Next.js code
- **Sandbox Status**: The current state of a sandbox: "idle", "checking", "resuming", "ready", "expired", or "error"
- **Device Preset**: A predefined screen dimension (Desktop: 1440x1024, Tablet: 1133x744, Mobile: 402x874)

## Requirements

### Requirement 1

**User Story:** As a designer, I want to see a toolbar above my selected screen shape, so that I can quickly access screen-related actions.

#### Acceptance Criteria

1. WHEN a screen shape is selected THEN the Screen Toolbar SHALL appear centered above the screen shape
2. WHEN a screen shape is deselected THEN the Screen Toolbar SHALL be hidden
3. WHEN the Screen Toolbar is displayed THEN the Screen Toolbar SHALL show device icon, name input, preview icon, refresh icon, and delete icon in a horizontal layout
4. WHEN the Screen Toolbar is displayed THEN the Screen Toolbar SHALL have a clean, professional appearance with rounded corners and subtle shadow

### Requirement 2

**User Story:** As a designer, I want to resize my screen to different device sizes, so that I can preview my UI at common viewport dimensions.

#### Acceptance Criteria

1. WHEN a user clicks the device icon THEN the Screen Toolbar SHALL display a dropdown with Desktop (1440x1024), Tablet (1133x744), and Mobile (402x874) options
2. WHEN a user selects a device preset THEN the Screen Shape SHALL resize to the selected dimensions
3. WHEN a device preset is selected THEN the dropdown SHALL close automatically
4. WHEN the device dropdown is displayed THEN each option SHALL show an appropriate device icon and dimensions

### Requirement 3

**User Story:** As a designer, I want to rename my screen, so that I can organize and identify my screens easily.

#### Acceptance Criteria

1. WHEN the Screen Toolbar is displayed THEN the name field SHALL show the current screen title
2. WHEN a user clicks the name field THEN the name field SHALL become editable
3. WHEN a user edits the name and presses Enter or blurs the field THEN the Screen Toolbar SHALL save the new name to Convex
4. WHEN a user attempts to save an empty name THEN the Screen Toolbar SHALL prevent the save and restore the previous name
5. WHEN the name is being saved THEN the Screen Toolbar SHALL show a brief saving indicator

### Requirement 4

**User Story:** As a designer, I want to preview my screen in a new browser tab, so that I can see the full-size UI without canvas constraints.

#### Acceptance Criteria

1. WHEN a user clicks the preview icon and sandbox status is "ready" THEN the Screen Toolbar SHALL open the sandbox URL in a new browser tab
2. WHEN a user clicks the preview icon and sandbox status is "resuming" or "checking" THEN the Screen Toolbar SHALL wait for sandbox to be ready before opening the URL
3. WHEN a user clicks the preview icon and sandbox is paused THEN the Screen Toolbar SHALL resume the sandbox first and then open the URL in a new tab
4. WHEN sandbox status is "expired" THEN the preview icon SHALL be disabled with a tooltip explaining the sandbox has expired
5. WHEN sandbox status is "idle" (no sandbox exists) THEN the preview icon SHALL be disabled with a tooltip explaining no preview is available

### Requirement 5

**User Story:** As a designer, I want to refresh the screen preview, so that I can see the latest changes without reloading the entire page.

#### Acceptance Criteria

1. WHEN a user clicks the refresh icon and sandbox status is "ready" THEN the Screen Toolbar SHALL reload the iframe content
2. WHEN sandbox status is "resuming", "checking", "expired", or "idle" THEN the refresh icon SHALL be disabled
3. WHEN the refresh action is triggered THEN the iframe SHALL reload its current source URL

### Requirement 6

**User Story:** As a designer, I want to delete a screen from the toolbar, so that I can remove unwanted screens quickly.

#### Acceptance Criteria

1. WHEN a user clicks the delete icon THEN the Screen Toolbar SHALL open the existing delete confirmation modal
2. WHEN the user confirms deletion THEN the Screen Shape SHALL be removed from the canvas and the screen record deleted from Convex
3. WHEN the user cancels deletion THEN the Screen Shape SHALL remain unchanged

### Requirement 7

**User Story:** As a designer, I want to resume a paused sandbox from the toolbar, so that I can continue working with my screen preview.

#### Acceptance Criteria

1. WHEN sandbox status is "resuming" or "checking" THEN the Screen Toolbar SHALL show a loading indicator in place of action icons
2. WHEN sandbox status is "expired" THEN the Screen Toolbar SHALL show an expired indicator and disable preview/refresh actions
3. WHEN sandbox status is "error" THEN the Screen Toolbar SHALL show a retry button to attempt resuming again

### Requirement 8

**User Story:** As a designer, I want the toolbar to follow my screen shape, so that it remains accessible as I pan and zoom the canvas.

#### Acceptance Criteria

1. WHEN the canvas viewport is panned THEN the Screen Toolbar SHALL move with the screen shape
2. WHEN the canvas viewport is zoomed THEN the Screen Toolbar SHALL maintain its position relative to the screen shape
3. WHEN the screen shape is moved THEN the Screen Toolbar SHALL update its position to remain centered above the shape
