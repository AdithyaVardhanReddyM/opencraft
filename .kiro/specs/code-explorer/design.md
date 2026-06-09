# Design Document: Code Explorer

## Overview

The Code Explorer feature extends the AI Sidebar to provide users with a comprehensive view of the generated code within their E2B sandbox. When activated via the "Code" tab, the sidebar expands to occupy approximately 50% of the viewport, revealing a split-panel interface with a file tree navigator and a syntax-highlighted code viewer.

The feature employs an on-demand fetching strategy to optimize performance:

1. File tree structure is fetched lazily as users expand folders
2. File contents are served from cache when available (from AI tool calls)
3. Uncached files are fetched directly from the sandbox

This approach minimizes unnecessary API calls while ensuring users always have access to the latest code.

## Architecture

```mermaid
graph TB
    subgraph "Frontend (React)"
        AISidebar[AISidebar Component]
        CodeExplorer[CodeExplorer Component]
        FileTree[FileTree Component]
        CodeViewer[CodeViewer Component]
        useCodeExplorer[useCodeExplorer Hook]
    end

    subgraph "API Layer"
        SandboxAPI[/api/sandbox/files]
    end

    subgraph "Backend"
        E2BSandbox[E2B Sandbox]
        ConvexDB[(Convex DB)]
    end

    AISidebar --> CodeExplorer
    CodeExplorer --> FileTree
    CodeExplorer --> CodeViewer
    CodeExplorer --> useCodeExplorer

    useCodeExplorer --> SandboxAPI
    useCodeExplorer --> ConvexDB

    SandboxAPI --> E2BSandbox
```

## Components and Interfaces

### 1. CodeExplorer Component

The main container component that manages the split-panel layout.

```typescript
interface CodeExplorerProps {
  screenId?: string;
  sandboxId?: string;
  cachedFiles?: Record<string, string>;
  isExpanded: boolean;
}
```

**Responsibilities:**

- Render split-panel layout (file tree + code viewer)
- Manage selected file state
- Handle empty/error states
- Coordinate between file tree and code viewer

### 2. FileTree Component

Displays the hierarchical file structure with expand/collapse functionality.

```typescript
interface FileTreeProps {
  sandboxId: string;
  cachedFiles?: Record<string, string>;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
}

interface FileTreeItem {
  name: string;
  path: string;
  type: "file" | "folder";
  extension?: string;
}
```

**Responsibilities:**

- Display file/folder hierarchy
- Handle folder expand/collapse
- Trigger file selection
- Show loading states per folder
- Display appropriate icons

### 3. CodeViewer Component

Displays file contents with syntax highlighting.

```typescript
interface CodeViewerProps {
  content: string | null;
  filePath: string | null;
  isLoading: boolean;
  error: string | null;
  onCopy: () => void;
  onRetry: () => void;
}
```

**Responsibilities:**

- Render code with syntax highlighting (using Shiki)
- Provide copy functionality
- Display loading/error states
- Show file path header

### 4. useCodeExplorer Hook

Custom hook managing all Code Explorer state and data fetching.

```typescript
interface UseCodeExplorerOptions {
  sandboxId?: string;
  cachedFiles?: Record<string, string>;
  enabled: boolean;
}

interface UseCodeExplorerReturn {
  // File tree state
  fileTree: Map<string, FileTreeItem[]>;
  expandedFolders: Set<string>;
  loadingFolders: Set<string>;
  folderErrors: Map<string, string>;

  // Selected file state
  selectedPath: string | null;
  fileContent: string | null;
  isLoadingContent: boolean;
  contentError: string | null;

  // Actions
  toggleFolder: (path: string) => Promise<void>;
  selectFile: (path: string) => Promise<void>;
  retryFolder: (path: string) => Promise<void>;
  retryFile: () => Promise<void>;
  reset: () => void;
}
```

### 5. API Route: `/api/sandbox/files`

Server-side API for sandbox file operations.

```typescript
// GET /api/sandbox/files?sandboxId=xxx&path=/home/user
interface ListFilesResponse {
  items: FileTreeItem[];
}

// GET /api/sandbox/files/content?sandboxId=xxx&path=/home/user/app/page.tsx
interface ReadFileResponse {
  content: string;
}
```

## Data Models

### FileTreeItem

```typescript
interface FileTreeItem {
  name: string; // Display name (e.g., "page.tsx")
  path: string; // Full path (e.g., "/home/user/app/page.tsx")
  type: "file" | "folder";
  extension?: string; // File extension without dot (e.g., "tsx")
}
```

### CodeExplorerState

```typescript
interface CodeExplorerState {
  // Tree structure: path -> children
  fileTree: Map<string, FileTreeItem[]>;

  // UI state
  expandedFolders: Set<string>;
  loadingFolders: Set<string>;
  folderErrors: Map<string, string>;

  // Selected file
  selectedPath: string | null;
  fileContent: string | null;
  isLoadingContent: boolean;
  contentError: string | null;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: File system items are sorted with folders first, then alphabetically

_For any_ list of file system items (files and folders), when sorted by the sorting function, the result SHALL have all folders appearing before all files, and within each group (folders and files), items SHALL be sorted alphabetically by name (case-insensitive).

**Validates: Requirements 2.6**

### Property 2: File extension maps to correct icon

_For any_ valid file extension string, the icon mapping function SHALL return a consistent, non-null icon identifier. Files with the same extension SHALL always receive the same icon.

**Validates: Requirements 2.7**

### Property 3: Folder toggle changes expansion state

_For any_ folder path and initial expansion state, toggling the folder SHALL result in the opposite expansion state. If the folder was expanded, it becomes collapsed. If collapsed, it becomes expanded.

**Validates: Requirements 2.2, 2.3**

### Property 4: Cache-first file content retrieval

_For any_ file path, if the path exists in the cached files map, the content retrieval function SHALL return the cached content without making a sandbox API call. If the path does not exist in cache, the function SHALL fetch from the sandbox.

**Validates: Requirements 3.2, 3.3**

### Property 5: File extension maps to correct syntax language

_For any_ valid file extension string, the language mapping function SHALL return a valid syntax highlighting language identifier. Common extensions (ts, tsx, js, jsx, json, css, html, md) SHALL map to their corresponding languages.

**Validates: Requirements 3.6**

### Property 6: Tab switch preserves explorer state

_For any_ Code Explorer state (expanded folders and selected file), switching to another tab and back SHALL preserve the expanded folders set and the selected file path.

**Validates: Requirements 6.1, 6.2**

### Property 7: Screen change resets explorer state

_For any_ Code Explorer state, when the screen selection changes to a different screen, the file tree, expanded folders, and selected file SHALL all be reset to their initial empty states.

**Validates: Requirements 6.3**

## Error Handling

### Sandbox Connection Errors

- **Scenario**: Sandbox is paused, expired, or unreachable
- **Handling**: Display user-friendly error message with suggestion to try again
- **Recovery**: Provide retry button that attempts reconnection

### File/Folder Fetch Errors

- **Scenario**: Individual file or folder fetch fails
- **Handling**: Show error indicator on the specific item
- **Recovery**: Provide retry option per item

### Empty States

| State              | Message                                    |
| ------------------ | ------------------------------------------ |
| No screen selected | "Select a screen to view its code"         |
| No sandbox session | "Generate some code first to view it here" |
| Empty folder       | "This folder is empty"                     |
| No files generated | "No files have been generated yet"         |

## Testing Strategy

### Dual Testing Approach

This feature uses both unit tests and property-based tests:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property-based tests**: Verify universal properties that should hold across all inputs

### Property-Based Testing

**Library**: fast-check (TypeScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Test File Location**: `lib/canvas/__tests__/code-explorer.test.ts`

**Property Test Format**:

```typescript
// **Feature: code-explorer, Property 1: File system items are sorted with folders first, then alphabetically**
test.prop([fc.array(fileTreeItemArb)])(
  "sorts folders before files alphabetically",
  (items) => {
    const sorted = sortFileTreeItems(items);
    // Assert folders come before files
    // Assert alphabetical order within groups
  }
);
```

### Unit Testing

**Test Cases**:

1. Icon mapping for common file extensions
2. Language detection for syntax highlighting
3. Cache hit/miss scenarios
4. Error state rendering
5. Empty state rendering

### Test Utilities

```typescript
// Arbitrary generators for property tests
const fileTreeItemArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  path: fc.string({ minLength: 1 }),
  type: fc.constantFrom("file", "folder"),
  extension: fc.option(
    fc.stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")), {
      minLength: 1,
      maxLength: 5,
    })
  ),
});
```

## UI/UX Specifications

### Sidebar Expansion

- **Collapsed width**: 340px (existing)
- **Expanded width**: 50vw (approximately)
- **Animation**: 200ms ease-out transition
- **Trigger**: Clicking "Code" tab

### Split Panel Layout

- **File tree width**: ~30% of expanded sidebar
- **Code viewer width**: ~70% of expanded sidebar
- **Divider**: 1px border with subtle hover effect
- **Min widths**: File tree 200px, Code viewer 300px

### File Tree Styling

- **Indentation**: 16px per level
- **Row height**: 32px
- **Icon size**: 16px
- **Hover state**: Subtle background highlight
- **Selected state**: Primary color background tint
- **Loading state**: Spinner icon replacing folder icon

### Code Viewer Styling

- **Font**: Monospace (system or Geist Mono)
- **Font size**: 13px
- **Line height**: 1.5
- **Background**: Slightly darker than sidebar
- **Line numbers**: Muted color, right-aligned
- **Copy button**: Top-right corner, appears on hover

### Icons by File Type

| Extension | Icon                   |
| --------- | ---------------------- |
| folder    | Folder                 |
| ts, tsx   | FileCode (blue tint)   |
| js, jsx   | FileCode (yellow tint) |
| json      | FileJson               |
| css, scss | FileCode (pink tint)   |
| html      | FileCode (orange tint) |
| md        | FileText               |
| default   | File                   |
