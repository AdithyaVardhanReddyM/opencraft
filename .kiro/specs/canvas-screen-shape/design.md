# Design Document: Canvas Screen Shape

## Overview

The Screen shape is a new canvas element that embeds AI-generated web content via iframes. Each Screen maintains its own chat thread for iterative UI generation, with all data persisted to Convex. The feature integrates with the existing Inngest AgentKit workflow to generate Next.js components in E2B sandboxes.

## Architecture

```mermaid
graph TB
    subgraph Canvas Layer
        TB[Toolbar] --> |Add Screen| CR[Canvas Reducer]
        CR --> |Update State| CS[Canvas State]
        SS[Screen Shape] --> |Render| IF[Iframe/Placeholder]
    end

    subgraph Chat Layer
        AS[AI Sidebar] --> |Send Message| API[/api/chat]
        API --> |Trigger| IW[Inngest Workflow]
        IW --> |Update| CX[Convex]
        CX --> |Query| AS
    end

    subgraph Data Layer
        CX --> |screens table| ST[Screen Records]
        CX --> |messages table| MT[Message Records]
    end

    CS --> |Selected Screen| AS
    IW --> |sandbox URL| ST
    ST --> |URL| SS
```

## Components and Interfaces

### 1. Screen Shape Type

```typescript
// types/canvas.ts
export interface ScreenShape extends BaseShape {
  type: "screen";
  x: number;
  y: number;
  w: number;
  h: number;
  screenId: string; // Convex document ID reference
}

// Update Tool type
export type Tool =
  | "select"
  | "hand"
  | "frame"
  | "rect"
  | "ellipse"
  | "freedraw"
  | "arrow"
  | "line"
  | "text"
  | "eraser"
  | "screen";

// Update Shape union
export type Shape =
  | FrameShape
  | RectShape
  | EllipseShape
  | FreeDrawShape
  | ArrowShape
  | LineShape
  | TextShape
  | GeneratedUIShape
  | ScreenShape;
```

### 2. Convex Schema Extensions

```typescript
// convex/schema.ts
screens: defineTable({
  shapeId: v.string(),        // Canvas shape ID (nanoid)
  projectId: v.id("projects"),
  title: v.optional(v.string()),
  sandboxUrl: v.optional(v.string()),
  files: v.optional(v.any()), // JSON: { [path: string]: string }
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_shapeId", ["shapeId"])
  .index("by_projectId", ["projectId"]),

messages: defineTable({
  screenId: v.id("screens"),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  createdAt: v.number(),
})
  .index("by_screenId", ["screenId"]),
```

### 3. Convex Functions

```typescript
// convex/screens.ts
export const createScreen = mutation({
  args: {
    shapeId: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Verify auth and project ownership
    // Insert screen record
    // Return screen ID
  },
});

export const updateScreen = mutation({
  args: {
    screenId: v.id("screens"),
    sandboxUrl: v.optional(v.string()),
    files: v.optional(v.any()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify auth
    // Update screen record
  },
});

export const deleteScreen = mutation({
  args: {
    screenId: v.id("screens"),
  },
  handler: async (ctx, args) => {
    // Verify auth
    // Delete all messages for this screen
    // Delete screen record
  },
});

export const getScreenByShapeId = query({
  args: {
    shapeId: v.string(),
  },
  handler: async (ctx, args) => {
    // Return screen record by shapeId
  },
});

// convex/messages.ts
export const createMessage = mutation({
  args: {
    screenId: v.id("screens"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify auth
    // Insert message record
  },
});

export const getMessages = query({
  args: {
    screenId: v.id("screens"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Return messages ordered by createdAt
  },
});

export const deleteMessagesByScreen = mutation({
  args: {
    screenId: v.id("screens"),
  },
  handler: async (ctx, args) => {
    // Delete all messages for screen
  },
});
```

### 4. Screen Shape Component

```typescript
// components/canvas/shapes/Screen.tsx
interface ScreenProps {
  shape: ScreenShape;
  isSelected: boolean;
  screenData?: {
    sandboxUrl?: string;
    title?: string;
  };
}

export function Screen({ shape, isSelected, screenData }: ScreenProps) {
  // Render browser chrome (title bar with dots)
  // If sandboxUrl exists: render iframe
  // Else: render empty state placeholder
}
```

### 5. Delete Confirmation Modal

```typescript
// components/canvas/DeleteScreenModal.tsx
interface DeleteScreenModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  screenTitle?: string;
}

export function DeleteScreenModal({
  isOpen,
  onConfirm,
  onCancel,
  screenTitle,
}: DeleteScreenModalProps) {
  // AlertDialog with warning message
  // Confirm and Cancel buttons
}
```

### 6. Updated AI Sidebar

The AI Sidebar will be enhanced to:

- Accept a `selectedScreenId` prop
- Query messages for the selected screen
- Send messages with the screen ID
- Display loading/error states

### 7. API Route Updates

```typescript
// app/api/chat/route.ts
// Add screenId to request schema
const schema = z.object({
  message: z.string().min(1),
  screenId: z.string(), // Required: Convex screen ID
  projectId: z.string(), // Required: Convex project ID
});
```

### 8. Inngest Workflow Updates

```typescript
// inngest/functions.ts
// Add step to update Convex after workflow completes
const updateResult = await step.run("update-screen-in-convex", async () => {
  // Call Convex mutation to update screen with:
  // - sandboxUrl
  // - files
  // - title (extracted from summary)
});

// Add step to create assistant message
await step.run("create-assistant-message", async () => {
  // Call Convex mutation to create message with summary
});
```

## Data Models

### Screen Record

| Field      | Type           | Description                    |
| ---------- | -------------- | ------------------------------ |
| \_id       | Id<"screens">  | Convex document ID             |
| shapeId    | string         | Canvas shape ID (nanoid)       |
| projectId  | Id<"projects"> | Parent project reference       |
| title      | string?        | Screen title (from AI summary) |
| sandboxUrl | string?        | E2B sandbox URL for iframe     |
| files      | object?        | Generated files JSON           |
| createdAt  | number         | Creation timestamp             |
| updatedAt  | number         | Last update timestamp          |

### Message Record

| Field     | Type                  | Description             |
| --------- | --------------------- | ----------------------- |
| \_id      | Id<"messages">        | Convex document ID      |
| screenId  | Id<"screens">         | Parent screen reference |
| role      | "user" \| "assistant" | Message sender          |
| content   | string                | Message content         |
| createdAt | number                | Creation timestamp      |

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Screen creation with correct dimensions

_For any_ canvas state, when a Screen shape is added, the resulting shape SHALL have width 1440 and height 1024.
**Validates: Requirements 1.1**

### Property 2: Empty state display

_For any_ Screen shape with no sandboxUrl, the rendered output SHALL contain placeholder text encouraging AI generation.
**Validates: Requirements 1.2, 8.3**

### Property 3: Iframe rendering with URL

_For any_ Screen shape with a valid sandboxUrl, the rendered output SHALL contain an iframe element with src equal to the sandboxUrl.
**Validates: Requirements 1.3**

### Property 4: Screen movement updates position

_For any_ Screen shape and any valid drag delta, after a move operation, the shape's x and y coordinates SHALL equal the original coordinates plus the delta.
**Validates: Requirements 2.1**

### Property 5: Screen resize respects minimum

_For any_ Screen shape and any resize operation, the resulting dimensions SHALL be at least 320 pixels wide and 240 pixels tall.
**Validates: Requirements 2.3**

### Property 6: Thread message loading

_For any_ Screen with existing messages, when the chat sidebar opens for that Screen, the displayed messages SHALL match the messages stored in Convex for that Screen's ID.
**Validates: Requirements 3.2**

### Property 7: Message association with screen

_For any_ message sent while a Screen is selected, the created message record SHALL have screenId equal to the selected Screen's Convex ID.
**Validates: Requirements 3.3**

### Property 8: Thread switching on selection

_For any_ two Screen shapes with different message histories, selecting each Screen SHALL display only that Screen's messages.
**Validates: Requirements 3.4**

### Property 9: Workflow trigger with screen ID

_For any_ message sent from the chat sidebar, the API request SHALL include the screenId of the currently selected Screen.
**Validates: Requirements 4.1**

### Property 10: Workflow updates screen in Convex

_For any_ successful Inngest workflow completion, the Screen record in Convex SHALL be updated with the sandboxUrl, files, and title from the workflow result.
**Validates: Requirements 4.3, 7.2**

### Property 11: Summary displayed as message

_For any_ successful Inngest workflow completion, a new assistant message SHALL be created containing the workflow summary.
**Validates: Requirements 4.4**

### Property 12: Iframe refresh on URL update

_For any_ Screen shape, when its sandboxUrl changes in Convex, the iframe src SHALL update to the new URL.
**Validates: Requirements 4.5**

### Property 13: Error message on workflow failure

_For any_ Inngest workflow that fails, an error message SHALL be displayed in the chat.
**Validates: Requirements 4.6**

### Property 14: Eraser ignores Screen shapes

_For any_ Screen shape and any eraser operation at any point within the Screen's bounds, the Screen SHALL NOT be deleted.
**Validates: Requirements 5.1, 5.2**

### Property 15: Deletion cascade removes messages

_For any_ Screen deletion that is confirmed, all message records with that Screen's ID SHALL be deleted from Convex.
**Validates: Requirements 6.3, 7.4**

### Property 16: Screen record creation

_For any_ new Screen shape added to the canvas, a corresponding screen record SHALL be created in Convex with the shape's ID and project ID.
**Validates: Requirements 7.1**

### Property 17: Message record creation

_For any_ message sent in a Screen's chat, a message record SHALL be created in Convex with the content, role, screenId, and timestamp.
**Validates: Requirements 7.3**

### Property 18: Browser chrome rendering

_For any_ Screen shape, the rendered output SHALL include a title bar with browser-like chrome elements.
**Validates: Requirements 8.1**

## Error Handling

### Canvas Errors

- **Invalid screen position**: Clamp to canvas bounds
- **Resize below minimum**: Enforce 320x240 minimum
- **Missing screen data**: Show placeholder state

### API Errors

- **Unauthorized**: Redirect to login
- **Invalid request**: Show validation error in chat
- **Network failure**: Show retry option

### Workflow Errors

- **Sandbox creation failure**: Display error message, allow retry
- **Code generation failure**: Display error with details
- **Timeout**: Display timeout message, suggest simplifying prompt

### Database Errors

- **Screen not found**: Handle gracefully, show error state
- **Message creation failure**: Retry with exponential backoff
- **Deletion failure**: Show error, keep modal open

## Testing Strategy

### Unit Testing

- Test shape factory creates Screen with correct defaults
- Test hit testing excludes Screen for eraser tool
- Test minimum size enforcement in resize logic
- Test message association logic

### Property-Based Testing

The project will use **fast-check** for property-based testing in TypeScript/JavaScript.

Each property-based test MUST:

1. Run a minimum of 100 iterations
2. Include a comment referencing the correctness property: `**Feature: canvas-screen-shape, Property {number}: {property_text}**`
3. Use smart generators that constrain to valid input spaces

Properties to implement as PBT:

- Property 1: Screen creation dimensions
- Property 4: Screen movement
- Property 5: Screen resize minimum
- Property 7: Message association
- Property 14: Eraser ignores Screen
- Property 15: Deletion cascade

### Integration Testing

- Test full flow: add screen → send message → receive response → see iframe
- Test thread switching between multiple screens
- Test delete confirmation and cascade

### Manual Testing

- Visual verification of browser chrome styling
- Empty state placeholder appearance
- Iframe content loading and refresh
- Modal appearance and interactions
