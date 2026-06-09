# Design Document: Screen Shape Toolbar

## Overview

The Screen Shape Toolbar is a floating UI component that appears above selected screen shapes on the canvas. It provides quick access to device size presets, screen name editing, preview in new tab, refresh iframe, and delete functionality. The toolbar integrates with the existing sandbox resume hook to handle paused/expired sandbox states appropriately.

## Architecture

The feature follows the existing canvas architecture patterns:

1. **Component-based**: A new `ScreenToolbar` component renders above selected screen shapes
2. **Context-driven**: Uses `CanvasContext` for viewport state and shape dispatch
3. **Convex integration**: Updates screen titles via existing mutations
4. **Sandbox awareness**: Leverages `useSandboxResume` hook for sandbox state management

```
┌─────────────────────────────────────────────────────────────┐
│                     Canvas Page                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              ScreenToolbar (floating)                │    │
│  │  [Device ▼] [Screen Name    ] [Preview][Refresh][🗑] │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Screen Shape                       │    │
│  │              (iframe with sandbox URL)               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### ScreenToolbar Component

```typescript
interface ScreenToolbarProps {
  shape: ScreenShape;
  screenData: {
    _id: Id<"screens">;
    sandboxUrl?: string;
    sandboxId?: string;
    title?: string;
  };
  viewport: ViewportState;
  onDelete: () => void;
  onResize: (width: number, height: number) => void;
  onRefresh: () => void;
}
```

### Device Presets

```typescript
interface DevicePreset {
  id: "desktop" | "tablet" | "mobile";
  label: string;
  icon: LucideIcon;
  width: number;
  height: number;
}

const DEVICE_PRESETS: DevicePreset[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: 1440, height: 1024 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: 1133, height: 744 },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: 402, height: 874 },
];
```

### Toolbar Position Calculation

```typescript
interface ToolbarPosition {
  x: number; // Screen coordinates
  y: number; // Screen coordinates
}

function calculateToolbarPosition(
  shape: ScreenShape,
  viewport: ViewportState,
  toolbarWidth: number,
  toolbarHeight: number
): ToolbarPosition {
  // Convert shape world coordinates to screen coordinates
  const screenX = shape.x * viewport.scale + viewport.translate.x;
  const screenY = shape.y * viewport.scale + viewport.translate.y;
  const screenWidth = shape.w * viewport.scale;

  // Center toolbar above shape with gap
  return {
    x: screenX + screenWidth / 2 - toolbarWidth / 2,
    y: screenY - toolbarHeight - TOOLBAR_GAP,
  };
}
```

## Data Models

### Screen Record (existing in Convex)

```typescript
interface Screen {
  _id: Id<"screens">;
  shapeId: string;
  projectId: Id<"projects">;
  sandboxUrl?: string;
  sandboxId?: string;
  title?: string;
  files?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}
```

### Toolbar State

```typescript
interface ToolbarState {
  isEditingName: boolean;
  editedName: string;
  isSaving: boolean;
  isDeviceDropdownOpen: boolean;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Toolbar visibility follows selection state

_For any_ screen shape and selection state, the toolbar SHALL be visible if and only if the screen shape is selected.
**Validates: Requirements 1.1, 1.2**

### Property 2: Device preset resize correctness

_For any_ device preset selection, the screen shape dimensions SHALL equal the preset's width and height values.
**Validates: Requirements 2.2**

### Property 3: Name field displays current title

_For any_ screen with a title, the toolbar name field SHALL display that exact title string.
**Validates: Requirements 3.1**

### Property 4: Empty name validation

_For any_ name input that is empty or contains only whitespace, the save operation SHALL be rejected and the previous name restored.
**Validates: Requirements 3.4**

### Property 5: Preview button state based on sandbox status

_For any_ sandbox status that is "expired" or "idle", the preview button SHALL be disabled.
**Validates: Requirements 4.4, 4.5**

### Property 6: Refresh button state based on sandbox status

_For any_ sandbox status that is not "ready", the refresh button SHALL be disabled.
**Validates: Requirements 5.2**

### Property 7: Toolbar position follows viewport transform

_For any_ viewport pan/zoom state and screen shape position, the toolbar screen position SHALL be calculated as: `(shape.x * scale + translate.x + shape.w * scale / 2 - toolbarWidth / 2, shape.y * scale + translate.y - toolbarHeight - gap)`.
**Validates: Requirements 8.1, 8.2, 8.3**

### Property 8: Delete cancellation preserves shape

_For any_ delete action that is cancelled, the screen shape SHALL remain in the shapes list unchanged.
**Validates: Requirements 6.3**

## Error Handling

| Error Scenario               | Handling Strategy                               |
| ---------------------------- | ----------------------------------------------- |
| Name save fails              | Show toast error, restore previous name         |
| Sandbox resume fails         | Show error state in toolbar, enable retry       |
| Sandbox expired              | Disable preview/refresh, show expired indicator |
| Network error during preview | Show toast with retry option                    |
| Invalid screen data          | Gracefully hide toolbar, log error              |

## Testing Strategy

### Dual Testing Approach

This feature uses both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific UI interactions, edge cases, and integration points
- **Property-based tests**: Verify universal properties that should hold across all inputs

### Property-Based Testing Library

**Library**: `fast-check` for TypeScript/JavaScript property-based testing

**Configuration**: Each property test runs minimum 100 iterations

### Test File Structure

```
components/canvas/__tests__/
  ScreenToolbar.test.tsx       # Unit tests
  ScreenToolbar.property.test.tsx  # Property-based tests
lib/canvas/__tests__/
  toolbar-position.test.ts     # Position calculation unit tests
  toolbar-position.property.test.ts  # Position calculation property tests
```

### Property Test Annotations

Each property-based test MUST include a comment in this format:

```typescript
// **Feature: screen-shape-toolbar, Property {number}: {property_text}**
```

### Unit Test Coverage

- Toolbar renders when screen is selected
- Toolbar hides when screen is deselected
- Device dropdown opens/closes correctly
- Name editing flow (click, edit, save, cancel)
- Preview button behavior for each sandbox status
- Refresh button behavior for each sandbox status
- Delete button triggers modal
- Position updates on viewport change

### Property Test Coverage

1. Visibility property: toolbar visible ↔ screen selected
2. Device resize property: dimensions match preset
3. Name display property: field shows current title
4. Empty name validation property: empty names rejected
5. Preview disabled property: disabled for expired/idle
6. Refresh disabled property: disabled for non-ready
7. Position calculation property: correct screen coordinates
8. Delete cancel property: shape unchanged after cancel
