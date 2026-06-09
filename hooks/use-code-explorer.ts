"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  FileTreeItem,
  UseCodeExplorerOptions,
  UseCodeExplorerReturn,
  ListFilesResponse,
  ReadFileResponse,
} from "@/lib/canvas/code-explorer-types";
import {
  SANDBOX_ROOT,
  createInitialState,
} from "@/lib/canvas/code-explorer-types";
import {
  getContentFromCache,
  isPathInCache,
} from "@/lib/canvas/code-explorer-utils";

/**
 * Hook for managing Code Explorer state and data fetching
 */
export function useCodeExplorer({
  sandboxId,
  cachedFiles,
  enabled,
}: UseCodeExplorerOptions): UseCodeExplorerReturn {
  // File tree state
  const [fileTree, setFileTree] = useState<Map<string, FileTreeItem[]>>(
    new Map()
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const [folderErrors, setFolderErrors] = useState<Map<string, string>>(
    new Map()
  );

  // Selected file state
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  // Track previous sandboxId to detect changes
  const prevSandboxIdRef = useRef<string | undefined>(sandboxId);

  /**
   * Fetch folder contents from the sandbox
   */
  const fetchFolderContents = useCallback(
    async (path: string): Promise<FileTreeItem[] | null> => {
      if (!sandboxId) return null;

      try {
        const response = await fetch(
          `/api/sandbox/files?sandboxId=${encodeURIComponent(
            sandboxId
          )}&path=${encodeURIComponent(path)}`
        );

        const data: ListFilesResponse = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        return data.items;
      } catch (error) {
        throw error;
      }
    },
    [sandboxId]
  );

  /**
   * Fetch file content from the sandbox
   */
  const fetchFileContent = useCallback(
    async (path: string): Promise<string> => {
      if (!sandboxId) throw new Error("No sandbox ID");

      const response = await fetch(
        `/api/sandbox/files/content?sandboxId=${encodeURIComponent(
          sandboxId
        )}&path=${encodeURIComponent(path)}`
      );

      const data: ReadFileResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data.content;
    },
    [sandboxId]
  );

  /**
   * Toggle folder expansion
   */
  const toggleFolder = useCallback(
    async (path: string): Promise<void> => {
      // If already expanded, collapse it
      if (expandedFolders.has(path)) {
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
        return;
      }

      // If we already have the contents, just expand
      if (fileTree.has(path)) {
        setExpandedFolders((prev) => new Set(prev).add(path));
        return;
      }

      // Fetch contents
      setLoadingFolders((prev) => new Set(prev).add(path));
      setFolderErrors((prev) => {
        const next = new Map(prev);
        next.delete(path);
        return next;
      });

      try {
        const items = await fetchFolderContents(path);
        if (items) {
          setFileTree((prev) => new Map(prev).set(path, items));
          setExpandedFolders((prev) => new Set(prev).add(path));
        }
      } catch (error) {
        setFolderErrors((prev) =>
          new Map(prev).set(
            path,
            error instanceof Error ? error.message : "Failed to load folder"
          )
        );
      } finally {
        setLoadingFolders((prev) => {
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
      }
    },
    [expandedFolders, fileTree, fetchFolderContents]
  );

  /**
   * Select a file and load its content
   */
  const selectFile = useCallback(
    async (path: string): Promise<void> => {
      setSelectedPath(path);
      setContentError(null);

      // Check cache first
      const cachedContent = getContentFromCache(path, cachedFiles);
      if (cachedContent !== null) {
        setFileContent(cachedContent);
        return;
      }

      // Fetch from sandbox
      setIsLoadingContent(true);
      setFileContent(null);

      try {
        const content = await fetchFileContent(path);
        setFileContent(content);
      } catch (error) {
        setContentError(
          error instanceof Error ? error.message : "Failed to load file"
        );
      } finally {
        setIsLoadingContent(false);
      }
    },
    [cachedFiles, fetchFileContent]
  );

  /**
   * Retry loading a folder
   */
  const retryFolder = useCallback(
    async (path: string): Promise<void> => {
      // Clear error and try again
      setFolderErrors((prev) => {
        const next = new Map(prev);
        next.delete(path);
        return next;
      });

      // Remove from file tree to force refetch
      setFileTree((prev) => {
        const next = new Map(prev);
        next.delete(path);
        return next;
      });

      // Toggle will now fetch fresh
      await toggleFolder(path);
    },
    [toggleFolder]
  );

  /**
   * Retry loading the current file
   */
  const retryFile = useCallback(async (): Promise<void> => {
    if (selectedPath) {
      await selectFile(selectedPath);
    }
  }, [selectedPath, selectFile]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setFileTree(new Map());
    setExpandedFolders(new Set());
    setLoadingFolders(new Set());
    setFolderErrors(new Map());
    setSelectedPath(null);
    setFileContent(null);
    setIsLoadingContent(false);
    setContentError(null);
  }, []);

  // Reset state when sandboxId changes
  useEffect(() => {
    if (prevSandboxIdRef.current !== sandboxId) {
      reset();
      prevSandboxIdRef.current = sandboxId;
    }
  }, [sandboxId, reset]);

  // Load root folder when enabled and sandboxId is available
  useEffect(() => {
    if (enabled && sandboxId && !fileTree.has(SANDBOX_ROOT)) {
      toggleFolder(SANDBOX_ROOT);
    }
  }, [enabled, sandboxId, fileTree, toggleFolder]);

  return {
    // File tree state
    fileTree,
    expandedFolders,
    loadingFolders,
    folderErrors,

    // Selected file state
    selectedPath,
    fileContent,
    isLoadingContent,
    contentError,

    // Actions
    toggleFolder,
    selectFile,
    retryFolder,
    retryFile,
    reset,
  };
}
