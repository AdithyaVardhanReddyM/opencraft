# Requirements Document

## Introduction

This feature introduces a new "Screen" shape to the canvas that displays websites via an embedded iframe. Each Screen has its own dedicated AI chat thread, enabling users to generate and iterate on UI components directly within the canvas. The Screen shape integrates with the existing Inngest AgentKit workflow to create sandboxed Next.js environments, with results persisted to Convex and displayed in real-time.

## Glossary

- **Screen**: A canvas shape that displays a website via an iframe, with dimensions of 1440x1024 pixels by default
- **Chat Thread**: A conversation history associated with a specific Screen, containing user prompts and AI responses
- **Message**: A single entry in a chat thread, either from the user or the AI assistant
- **Sandbox URL**: The URL of an E2B sandbox environment where AI-generated code runs
- **Inngest Workflow**: The background job orchestration system that processes AI chat requests
- **Convex**: The backend database system used for persisting screens, threads, and messages

## Requirements

### Requirement 1

**User Story:** As a user, I want to add a Screen shape to my canvas, so that I can create AI-generated web pages and components within my design workspace.

#### Acceptance Criteria

1. WHEN a user clicks the Screen tool button in the toolbar THEN the Canvas System SHALL add a new Screen shape at the center of the visible viewport with dimensions 1440x1024 pixels
2. WHEN a Screen shape has no sandbox URL set THEN the Canvas System SHALL display a placeholder with text encouraging AI generation (e.g., "Create beautiful pages or components with AI")
3. WHEN a Screen shape has a valid sandbox URL THEN the Canvas System SHALL render an iframe displaying the sandbox content
4. WHEN the user presses the "W" key THEN the Canvas System SHALL activate the Screen tool

### Requirement 2

**User Story:** As a user, I want to move and resize Screen shapes on the canvas, so that I can arrange my AI-generated content alongside other design elements.

#### Acceptance Criteria

1. WHEN a user drags a selected Screen shape THEN the Canvas System SHALL update the Screen position to follow the cursor
2. WHEN a user drags a resize handle on a selected Screen THEN the Canvas System SHALL update the Screen dimensions proportionally
3. WHEN a Screen is resized THEN the Canvas System SHALL enforce a minimum size of 320x240 pixels
4. WHEN a Screen is moved or resized THEN the Canvas System SHALL persist the new position and dimensions

### Requirement 3

**User Story:** As a user, I want each Screen to have its own chat thread, so that I can have focused conversations about specific UI components.

#### Acceptance Criteria

1. WHEN a user clicks on a Screen shape THEN the Canvas System SHALL open the AI chat sidebar
2. WHEN the AI chat sidebar opens for a Screen THEN the Chat System SHALL load the existing message history for that Screen's thread
3. WHEN a user sends a message in the chat THEN the Chat System SHALL associate the message with the currently selected Screen's thread
4. WHEN a user selects a different Screen THEN the Chat System SHALL switch to display that Screen's chat thread

### Requirement 4

**User Story:** As a user, I want to send prompts to the AI and see generated UI in my Screen, so that I can iteratively build web interfaces.

#### Acceptance Criteria

1. WHEN a user sends a prompt in the chat sidebar THEN the Chat System SHALL trigger the Inngest workflow with the message and Screen ID
2. WHILE the Inngest workflow is processing THEN the Chat System SHALL display a loading indicator in the chat
3. WHEN the Inngest workflow completes successfully THEN the Workflow System SHALL update the Screen's sandbox URL, files, and summary in Convex
4. WHEN the Inngest workflow completes THEN the Chat System SHALL display the AI summary as a response message
5. WHEN the sandbox URL is updated THEN the Screen shape SHALL refresh the iframe to display the new content
6. IF the Inngest workflow encounters an error THEN the Chat System SHALL display an error message to the user

### Requirement 5

**User Story:** As a user, I want the eraser tool to not affect Screen shapes, so that I can safely erase other elements without accidentally removing my AI-generated content.

#### Acceptance Criteria

1. WHEN the eraser tool is active and the user clicks on a Screen shape THEN the Canvas System SHALL ignore the erase action for that shape
2. WHEN the eraser tool is active and the user drags over a Screen shape THEN the Canvas System SHALL skip the Screen during hit detection

### Requirement 6

**User Story:** As a user, I want to be warned before deleting a Screen shape, so that I don't accidentally lose my chat history and generated content.

#### Acceptance Criteria

1. WHEN a user attempts to delete a selected Screen shape THEN the Canvas System SHALL display a confirmation modal
2. WHEN the confirmation modal is displayed THEN the Modal SHALL inform the user that deleting will remove the Screen, chat messages, and associated data
3. WHEN the user confirms deletion in the modal THEN the Canvas System SHALL delete the Screen shape and all associated messages from Convex
4. WHEN the user cancels deletion in the modal THEN the Canvas System SHALL keep the Screen shape and close the modal

### Requirement 7

**User Story:** As a developer, I want Screen data persisted to Convex, so that users can access their AI-generated content across sessions.

#### Acceptance Criteria

1. WHEN a new Screen shape is created THEN the Backend System SHALL create a corresponding screen record in Convex with the shape ID, project ID, and default values
2. WHEN the Inngest workflow updates a Screen THEN the Backend System SHALL update the screen record with the new sandbox URL, files JSON, and title
3. WHEN a message is sent in a Screen's chat THEN the Backend System SHALL create a message record in Convex with the content, role, screen ID, and timestamp
4. WHEN a Screen is deleted THEN the Backend System SHALL delete all associated message records from Convex

### Requirement 8

**User Story:** As a user, I want the Screen shape to have a visually appealing design, so that it integrates well with the rest of my canvas.

#### Acceptance Criteria

1. WHEN a Screen shape is rendered THEN the Canvas System SHALL display a browser-like chrome with a title bar
2. WHEN a Screen shape is selected THEN the Canvas System SHALL display the standard bounding box with resize handles
3. WHEN a Screen has no content THEN the Canvas System SHALL display an aesthetically pleasing empty state with gradient background and centered prompt text
