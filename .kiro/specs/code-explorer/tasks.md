# Implementation Plan

- [x] 1. Create utility functions and types for Code Explorer

  - [x] 1.1 Create types and interfaces for Code Explorer
    - Create `lib/canvas/code-explorer-types.ts` with FileTreeItem, CodeExplorerState interfaces
    - Define type guards and utility types
    - _Requirements: 2.6, 2.7, 3.6_
  - [x] 1.2 Create file sorting utility function
    - Implement `sortFileTreeItems` function that sorts folders first, then files alphabetically
    - Handle case-insensitive sorting
    - _Requirements: 2.6_
  - [ ]\* 1.3 Write property test for file sorting
    - **Property 1: File system items are sorted with folders first, then alphabetically**
    - **Validates: Requirements 2.6**
  - [x] 1.4 Create file icon mapping utility function
    - Implement `getFileIcon` function mapping extensions to Lucide icons
    - Support ts, tsx, js, jsx, json, css, scss, html, md, and default
    - _Requirements: 2.7_
  - [ ]\* 1.5 Write property test for icon mapping
    - **Property 2: File extension maps to correct icon**
    - **Validates: Requirements 2.7**
  - [x] 1.6 Create syntax language mapping utility function
    - Implement `getLanguageFromExtension` function for Shiki highlighting
    - Map common extensions to language identifiers
    - _Requirements: 3.6_
  - [ ]\* 1.7 Write property test for language mapping
    - **Property 5: File extension maps to correct syntax language**
    - **Validates: Requirements 3.6**

- [x] 2. Create API route for sandbox file operations

  - [x] 2.1 Create sandbox files API route
    - Create `app/api/sandbox/files/route.ts` for listing directory contents
    - Use E2B sandbox `commands.run('ls -la')` to list files
    - Parse output into FileTreeItem array
    - _Requirements: 2.1, 2.2_
  - [x] 2.2 Create sandbox file content API route
    - Create `app/api/sandbox/files/content/route.ts` for reading file content
    - Use E2B sandbox `files.read()` to get content
    - Handle errors gracefully
    - _Requirements: 3.3_
  - [ ]\* 2.3 Write unit tests for API routes
    - Test directory listing parsing
    - Test file content retrieval
    - Test error handling
    - _Requirements: 2.1, 2.2, 3.3_

- [x] 3. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create useCodeExplorer hook

  - [x] 4.1 Implement core hook state management
    - Create `hooks/use-code-explorer.ts`
    - Manage fileTree, expandedFolders, loadingFolders, folderErrors state
    - Manage selectedPath, fileContent, isLoadingContent, contentError state
    - _Requirements: 2.1, 2.2, 2.3, 3.1_
  - [x] 4.2 Implement folder toggle functionality
    - Add `toggleFolder` function that expands/collapses folders
    - Fetch folder contents on first expansion
    - _Requirements: 2.2, 2.3_
  - [ ]\* 4.3 Write property test for folder toggle
    - **Property 3: Folder toggle changes expansion state**
    - **Validates: Requirements 2.2, 2.3**
  - [x] 4.4 Implement cache-first file content retrieval
    - Add `selectFile` function that checks cache first
    - Fetch from sandbox API if not in cache
    - _Requirements: 3.2, 3.3_
  - [ ]\* 4.5 Write property test for cache-first retrieval
    - **Property 4: Cache-first file content retrieval**
    - **Validates: Requirements 3.2, 3.3**
  - [x] 4.6 Implement state reset on screen change
    - Add effect to reset state when screenId changes
    - Clear fileTree, expandedFolders, selectedPath, fileContent
    - _Requirements: 6.3_
  - [ ]\* 4.7 Write property test for state reset
    - **Property 7: Screen change resets explorer state**
    - **Validates: Requirements 6.3**

- [x] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create FileTree component

  - [x] 6.1 Implement FileTree component structure
    - Create `components/canvas/code-explorer/FileTree.tsx`
    - Render hierarchical file/folder structure
    - Support indentation based on depth
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 6.2 Implement folder expand/collapse UI
    - Add chevron icons for expand/collapse indication
    - Handle click to toggle folder
    - Show loading spinner when fetching
    - _Requirements: 2.2, 2.3, 2.4_
  - [x] 6.3 Implement file selection UI
    - Highlight selected file
    - Handle click to select file
    - Show appropriate file type icons
    - _Requirements: 2.7, 3.1, 3.7_
  - [x] 6.4 Implement error and empty states
    - Show error indicator with retry for failed folders
    - Show empty state for empty folders
    - _Requirements: 2.5, 4.4_

- [x] 7. Create CodeViewer component

  - [x] 7.1 Implement CodeViewer component structure
    - Create `components/canvas/code-explorer/CodeViewer.tsx`
    - Display file path header
    - Render code content area
    - _Requirements: 3.1_
  - [x] 7.2 Implement syntax highlighting with Shiki
    - Use Shiki for code highlighting
    - Detect language from file extension
    - Style with dark theme
    - _Requirements: 3.6_
  - [x] 7.3 Implement copy functionality
    - Add copy button in header
    - Copy file content to clipboard
    - Show success indicator
    - _Requirements: 5.1, 5.2_
  - [x] 7.4 Implement loading and error states
    - Show loading skeleton when fetching
    - Display error message with retry button
    - _Requirements: 3.4, 3.5_
  - [x] 7.5 Implement empty states
    - Show placeholder when no file selected
    - Style consistently with sidebar design
    - _Requirements: 4.1, 4.2_

- [x] 8. Create CodeExplorer container component

  - [x] 8.1 Implement CodeExplorer layout
    - Create `components/canvas/code-explorer/CodeExplorer.tsx`
    - Implement split-panel layout (30/70)
    - Wire up FileTree and CodeViewer
    - _Requirements: 1.2_
  - [x] 8.2 Implement edge case handling
    - Show message when no screen selected
    - Show message when no sandbox session
    - Handle sandbox connection errors
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 9. Integrate CodeExplorer into AISidebar

  - [x] 9.1 Update AISidebar with expandable width
    - Add state for sidebar expansion
    - Implement width transition animation (340px to 50vw)
    - Trigger expansion on Code tab selection
    - _Requirements: 1.1, 1.3, 1.4_
  - [x] 9.2 Replace Code tab placeholder with CodeExplorer
    - Remove ComingSoonPlaceholder for Code tab
    - Render CodeExplorer component
    - Pass screenId, sandboxId, and cachedFiles props
    - _Requirements: 1.1, 1.2_
  - [x] 9.3 Implement state preservation on tab switch
    - Preserve expanded folders when switching tabs
    - Preserve selected file when switching tabs
    - _Requirements: 6.1, 6.2_
  - [ ]\* 9.4 Write property test for state preservation
    - **Property 6: Tab switch preserves explorer state**
    - **Validates: Requirements 6.1, 6.2**

- [x] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
