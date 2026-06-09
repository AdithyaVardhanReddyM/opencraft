/**
 * Code Explorer Types
 * Types and interfaces for the Code Explorer feature
 */

/**
 * Represents a file or folder in the file tree
 */
export interface FileTreeItem {
  /** Display name (e.g., "page.tsx") */
  name: string;
  /** Full path (e.g., "/home/user/app/page.tsx") */
  path: string;
  /** Whether this is a file or folder */
  type: "file" | "folder";
  /** File extension without dot (e.g., "tsx"), undefined for folders */
  extension?: string;
}

/**
 * State for the Code Explorer
 */
export interface CodeExplorerState {
  /** Tree structure: path -> children */
  fileTree: Map<string, FileTreeItem[]>;
  /** Set of expanded folder paths */
  expandedFolders: Set<string>;
  /** Set of folders currently being loaded */
  loadingFolders: Set<string>;
  /** Map of folder paths to error messages */
  folderErrors: Map<string, string>;
  /** Currently selected file path */
  selectedPath: string | null;
  /** Content of the selected file */
  fileContent: string | null;
  /** Whether file content is being loaded */
  isLoadingContent: boolean;
  /** Error message for file content loading */
  contentError: string | null;
}

/**
 * Props for the CodeExplorer component
 */
export interface CodeExplorerProps {
  /** Convex screen ID */
  screenId?: string;
  /** E2B sandbox ID */
  sandboxId?: string;
  /** Cached files from AI tool calls */
  cachedFiles?: Record<string, string>;
  /** Whether the code explorer is expanded */
  isExpanded: boolean;
}

/**
 * Props for the FileTree component
 */
export interface FileTreeProps {
  /** E2B sandbox ID */
  sandboxId: string;
  /** Cached files from AI tool calls */
  cachedFiles?: Record<string, string>;
  /** Currently selected file path */
  selectedPath: string | null;
  /** Callback when a file is selected */
  onSelectFile: (path: string) => void;
  /** Set of expanded folder paths */
  expandedFolders: Set<string>;
  /** Callback when a folder is toggled */
  onToggleFolder: (path: string) => void;
  /** Tree structure: path -> children */
  fileTree: Map<string, FileTreeItem[]>;
  /** Set of folders currently being loaded */
  loadingFolders: Set<string>;
  /** Map of folder paths to error messages */
  folderErrors: Map<string, string>;
  /** Callback to retry loading a folder */
  onRetryFolder: (path: string) => void;
}

/**
 * Props for the CodeViewer component
 */
export interface CodeViewerProps {
  /** File content to display */
  content: string | null;
  /** Path of the file being displayed */
  filePath: string | null;
  /** Whether content is being loaded */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Callback when copy button is clicked */
  onCopy: () => void;
  /** Callback when retry button is clicked */
  onRetry: () => void;
}

/**
 * Options for the useCodeExplorer hook
 */
export interface UseCodeExplorerOptions {
  /** E2B sandbox ID */
  sandboxId?: string;
  /** Cached files from AI tool calls */
  cachedFiles?: Record<string, string>;
  /** Whether the hook is enabled */
  enabled: boolean;
}

/**
 * Return type for the useCodeExplorer hook
 */
export interface UseCodeExplorerReturn {
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

/**
 * API response for listing files
 */
export interface ListFilesResponse {
  items: FileTreeItem[];
  error?: string;
}

/**
 * API response for reading file content
 */
export interface ReadFileResponse {
  content: string;
  error?: string;
}

/**
 * Type guard to check if an item is a folder
 */
export function isFolder(item: FileTreeItem): boolean {
  return item.type === "folder";
}

/**
 * Type guard to check if an item is a file
 */
export function isFile(item: FileTreeItem): boolean {
  return item.type === "file";
}

/**
 * Extract file extension from a filename
 */
export function getExtension(filename: string): string | undefined {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1 || lastDot === 0) {
    return undefined;
  }
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Get the parent path of a given path
 */
export function getParentPath(path: string): string {
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash <= 0) {
    return "/";
  }
  return path.slice(0, lastSlash);
}

/**
 * Join path segments
 */
export function joinPath(...segments: string[]): string {
  return segments
    .map((s, i) => (i === 0 ? s : s.replace(/^\/+/, "")))
    .join("/")
    .replace(/\/+/g, "/");
}

/**
 * Root path for the sandbox project
 */
export const SANDBOX_ROOT = "/home/user";

/**
 * Initial state for the Code Explorer
 */
export function createInitialState(): CodeExplorerState {
  return {
    fileTree: new Map(),
    expandedFolders: new Set(),
    loadingFolders: new Set(),
    folderErrors: new Map(),
    selectedPath: null,
    fileContent: null,
    isLoadingContent: false,
    contentError: null,
  };
}
