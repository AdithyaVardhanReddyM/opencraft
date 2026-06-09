/**
 * Code Explorer Utilities
 * Utility functions for the Code Explorer feature
 */

import {
  Folder,
  File,
  FileCode,
  FileJson,
  FileText,
  FileType,
  type LucideIcon,
} from "lucide-react";
import type { FileTreeItem } from "./code-explorer-types";

/**
 * Sort file tree items with folders first, then files, both alphabetically (case-insensitive)
 */
export function sortFileTreeItems(items: FileTreeItem[]): FileTreeItem[] {
  return [...items].sort((a, b) => {
    // Folders come before files
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }
    // Within same type, sort alphabetically (case-insensitive)
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}

/**
 * Icon configuration for file types
 */
interface FileIconConfig {
  icon: LucideIcon;
  className?: string;
}

/**
 * Map of file extensions to icon configurations
 */
const FILE_ICON_MAP: Record<string, FileIconConfig> = {
  // TypeScript
  ts: { icon: FileCode, className: "text-blue-400" },
  tsx: { icon: FileCode, className: "text-blue-400" },
  // JavaScript
  js: { icon: FileCode, className: "text-yellow-400" },
  jsx: { icon: FileCode, className: "text-yellow-400" },
  mjs: { icon: FileCode, className: "text-yellow-400" },
  cjs: { icon: FileCode, className: "text-yellow-400" },
  // JSON
  json: { icon: FileJson, className: "text-yellow-300" },
  // CSS/Styling
  css: { icon: FileCode, className: "text-pink-400" },
  scss: { icon: FileCode, className: "text-pink-400" },
  sass: { icon: FileCode, className: "text-pink-400" },
  less: { icon: FileCode, className: "text-pink-400" },
  // HTML
  html: { icon: FileCode, className: "text-orange-400" },
  htm: { icon: FileCode, className: "text-orange-400" },
  // Markdown
  md: { icon: FileText, className: "text-muted-foreground" },
  mdx: { icon: FileText, className: "text-muted-foreground" },
  // Config files
  yaml: { icon: FileType, className: "text-purple-400" },
  yml: { icon: FileType, className: "text-purple-400" },
  toml: { icon: FileType, className: "text-purple-400" },
  // Images
  svg: { icon: File, className: "text-green-400" },
  png: { icon: File, className: "text-green-400" },
  jpg: { icon: File, className: "text-green-400" },
  jpeg: { icon: File, className: "text-green-400" },
  gif: { icon: File, className: "text-green-400" },
  ico: { icon: File, className: "text-green-400" },
};

/**
 * Default icon configuration for unknown file types
 */
const DEFAULT_FILE_ICON: FileIconConfig = {
  icon: File,
  className: "text-muted-foreground",
};

/**
 * Folder icon configuration
 */
const FOLDER_ICON: FileIconConfig = {
  icon: Folder,
  className: "text-muted-foreground",
};

/**
 * Get the icon configuration for a file tree item
 */
export function getFileIcon(item: FileTreeItem): FileIconConfig {
  if (item.type === "folder") {
    return FOLDER_ICON;
  }

  const extension = item.extension?.toLowerCase();
  if (extension && FILE_ICON_MAP[extension]) {
    return FILE_ICON_MAP[extension];
  }

  return DEFAULT_FILE_ICON;
}

/**
 * Get the icon for a file extension
 */
export function getIconForExtension(extension?: string): FileIconConfig {
  if (!extension) {
    return DEFAULT_FILE_ICON;
  }

  const ext = extension.toLowerCase();
  return FILE_ICON_MAP[ext] || DEFAULT_FILE_ICON;
}

/**
 * Map of file extensions to Shiki language identifiers
 */
const LANGUAGE_MAP: Record<string, string> = {
  // TypeScript
  ts: "typescript",
  tsx: "tsx",
  // JavaScript
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  // JSON
  json: "json",
  // CSS/Styling
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  // HTML
  html: "html",
  htm: "html",
  // Markdown
  md: "markdown",
  mdx: "mdx",
  // Config files
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  // Shell
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  // Other
  xml: "xml",
  svg: "xml",
  sql: "sql",
  graphql: "graphql",
  gql: "graphql",
};

/**
 * Default language for unknown file types
 */
const DEFAULT_LANGUAGE = "plaintext";

/**
 * Get the Shiki language identifier for a file extension
 */
export function getLanguageFromExtension(extension?: string): string {
  if (!extension) {
    return DEFAULT_LANGUAGE;
  }

  const ext = extension.toLowerCase();
  return LANGUAGE_MAP[ext] || DEFAULT_LANGUAGE;
}

/**
 * Get the language for a file path
 */
export function getLanguageFromPath(filePath: string): string {
  const lastDot = filePath.lastIndexOf(".");
  if (lastDot === -1 || lastDot === filePath.length - 1) {
    return DEFAULT_LANGUAGE;
  }

  const extension = filePath.slice(lastDot + 1);
  return getLanguageFromExtension(extension);
}

/**
 * Parse ls -la output into FileTreeItem array
 * Example line: "drwxr-xr-x 2 user user 4096 Jan  1 00:00 folder_name"
 * Example line: "-rw-r--r-- 1 user user 1234 Jan  1 00:00 file.txt"
 */
export function parseLsOutput(
  output: string,
  parentPath: string
): FileTreeItem[] {
  const lines = output.trim().split("\n");
  const items: FileTreeItem[] = [];

  for (const line of lines) {
    // Skip empty lines and total line
    if (!line.trim() || line.startsWith("total ")) {
      continue;
    }

    // Parse the line - format: permissions links owner group size month day time name
    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) {
      continue;
    }

    // Name is everything after the 8th column (handles names with spaces)
    const name = parts.slice(8).join(" ");

    // Skip . and .. entries
    if (name === "." || name === "..") {
      continue;
    }

    // Skip hidden files (starting with .)
    if (name.startsWith(".")) {
      continue;
    }

    // Skip node_modules and other common directories/files to ignore
    const IGNORED_ITEMS = [
      "node_modules",
      ".next",
      ".git",
      "nextjs-app",
      "tsconfig.tsbuildinfo",
    ];
    if (IGNORED_ITEMS.includes(name)) {
      continue;
    }

    const permissions = parts[0];
    const isDirectory = permissions.startsWith("d");
    const fullPath = `${parentPath}/${name}`.replace(/\/+/g, "/");

    const item: FileTreeItem = {
      name,
      path: fullPath,
      type: isDirectory ? "folder" : "file",
    };

    // Add extension for files
    if (!isDirectory) {
      const lastDot = name.lastIndexOf(".");
      if (lastDot > 0) {
        item.extension = name.slice(lastDot + 1).toLowerCase();
      }
    }

    items.push(item);
  }

  return sortFileTreeItems(items);
}

/**
 * Convert a relative path (from AI tool calls) to absolute sandbox path
 */
export function toAbsolutePath(relativePath: string): string {
  // If already absolute, return as-is
  if (relativePath.startsWith("/")) {
    return relativePath;
  }
  // Prepend sandbox root
  return `/home/user/${relativePath}`.replace(/\/+/g, "/");
}

/**
 * Convert an absolute sandbox path to relative path
 */
export function toRelativePath(absolutePath: string): string {
  const prefix = "/home/user/";
  if (absolutePath.startsWith(prefix)) {
    return absolutePath.slice(prefix.length);
  }
  return absolutePath;
}

/**
 * Check if a path exists in the cached files
 * Handles both absolute and relative paths
 */
export function isPathInCache(
  path: string,
  cachedFiles?: Record<string, string>
): boolean {
  if (!cachedFiles) {
    return false;
  }

  // Check both absolute and relative versions
  const relativePath = toRelativePath(path);
  const absolutePath = toAbsolutePath(path);

  return relativePath in cachedFiles || absolutePath in cachedFiles;
}

/**
 * Get content from cache for a path
 * Handles both absolute and relative paths
 */
export function getContentFromCache(
  path: string,
  cachedFiles?: Record<string, string>
): string | null {
  if (!cachedFiles) {
    return null;
  }

  // Check relative path first (how AI stores them)
  const relativePath = toRelativePath(path);
  if (relativePath in cachedFiles) {
    return cachedFiles[relativePath];
  }

  // Check absolute path
  const absolutePath = toAbsolutePath(path);
  if (absolutePath in cachedFiles) {
    return cachedFiles[absolutePath];
  }

  return null;
}
