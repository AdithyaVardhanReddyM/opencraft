"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCanvasContext } from "@/contexts/CanvasContext";
import {
  serializeCanvasState,
  deserializeCanvasState,
  saveToLocalStorage,
  loadRawFromLocalStorage,
  clearOldLocalStorageData,
  type CanvasProjectData,
} from "@/lib/canvas/persistence";
import {
  resolveConflict,
  deriveSaveStatus,
  calculateBackoffDelay,
  isRetryableError,
  classifyError,
  DEBOUNCE_CONFIG,
  RETRY_CONFIG,
  type SaveStatus,
  type AutosaveError,
} from "@/lib/canvas/autosave-utils";

export interface UseAutosaveOptions {
  localDebounceMs?: number;
  cloudDebounceMs?: number;
  maxRetries?: number;
}

export interface UseAutosaveReturn {
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  isLoading: boolean;
  error: AutosaveError | null;
  forceSave: () => Promise<void>;
  clearLocalData: () => void;
}

export function useAutosave(
  projectId: string,
  options: UseAutosaveOptions = {}
): UseAutosaveReturn {
  const {
    localDebounceMs = DEBOUNCE_CONFIG.localSaveMs,
    cloudDebounceMs = DEBOUNCE_CONFIG.cloudSyncMs,
    maxRetries = RETRY_CONFIG.maxRetries,
  } = options;

  const { viewport, dispatchViewport, shapes, dispatchShapes } =
    useCanvasContext();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<AutosaveError | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Refs for debouncing and retry
  const localSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cloudSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDoneRef = useRef(false);
  const pendingCloudSyncRef = useRef(false);

  // Convex mutation and query
  const saveCanvasState = useMutation(api.projects.saveCanvasState);
  const cloudState = useQuery(api.projects.getCanvasState, {
    projectId: projectId as Id<"projects">,
  });

  // Derive save status
  const saveStatus = deriveSaveStatus(isDirty, isSyncing, !!error, isOffline);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Trigger sync if there are pending changes
      if (pendingCloudSyncRef.current) {
        syncToCloud();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial status
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync to cloud with retry logic
  const syncToCloud = useCallback(async () => {
    if (isOffline) {
      pendingCloudSyncRef.current = true;
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const data = serializeCanvasState(viewport, shapes);

      await saveCanvasState({
        projectId: projectId as Id<"projects">,
        canvasData: {
          viewport: data.viewport,
          shapes: data.shapes,
          tool: data.tool,
          selected: data.selected,
          frameCounter: data.frameCounter,
          version: data.version,
          lastModified: data.lastModified,
        },
      });

      // Success
      setLastSavedAt(data.lastModified);
      setIsDirty(false);
      setError(null);
      retryCountRef.current = 0;
      pendingCloudSyncRef.current = false;

      pendo.track("canvas_state_saved", {
        project_id: projectId,
        shapes_count: data.shapes.ids.length,
        canvas_version: data.version,
      });
    } catch (err) {
      console.error("Cloud sync failed:", err);

      if (isRetryableError(err) && retryCountRef.current < maxRetries) {
        // Schedule retry with exponential backoff
        const delay = calculateBackoffDelay(retryCountRef.current);
        retryCountRef.current++;

        retryTimeoutRef.current = setTimeout(() => {
          syncToCloud();
        }, delay);
      } else {
        // Max retries reached or non-retryable error
        const classifiedError = classifyError(err);
        setError(classifiedError);
        pendingCloudSyncRef.current = true;

        // If auth error, don't mark as offline
        if (classifiedError.type !== "auth") {
          setIsOffline(true);
        }
      }
    } finally {
      setIsSyncing(false);
    }
  }, [viewport, shapes, projectId, saveCanvasState, isOffline, maxRetries]);

  // Save to localStorage (debounced)
  const saveToLocal = useCallback(() => {
    const result = saveToLocalStorage(projectId, viewport, shapes);

    if (!result.success) {
      if (result.error === "quota_exceeded") {
        // Try to clear old data and retry
        clearOldLocalStorageData(5);
        const retryResult = saveToLocalStorage(projectId, viewport, shapes);
        if (!retryResult.success) {
          setError({
            type: "localStorage",
            message:
              "Storage quota exceeded. Some data may not be saved locally.",
            timestamp: Date.now(),
          });
        }
      }
    }

    // Mark as dirty (needs cloud sync)
    setIsDirty(true);
  }, [projectId, viewport, shapes]);

  // Debounced local save effect
  useEffect(() => {
    // Skip during initial load
    if (!initialLoadDoneRef.current) return;

    // Clear existing timeout
    if (localSaveTimeoutRef.current) {
      clearTimeout(localSaveTimeoutRef.current);
    }

    // Schedule new save
    localSaveTimeoutRef.current = setTimeout(() => {
      saveToLocal();
    }, localDebounceMs);

    return () => {
      if (localSaveTimeoutRef.current) {
        clearTimeout(localSaveTimeoutRef.current);
      }
    };
  }, [viewport, shapes, localDebounceMs, saveToLocal]);

  // Debounced cloud sync effect (triggered after local save)
  useEffect(() => {
    // Skip during initial load or if not dirty
    if (!initialLoadDoneRef.current || !isDirty) return;

    // Clear existing timeout
    if (cloudSyncTimeoutRef.current) {
      clearTimeout(cloudSyncTimeoutRef.current);
    }

    // Schedule cloud sync
    cloudSyncTimeoutRef.current = setTimeout(() => {
      syncToCloud();
    }, cloudDebounceMs);

    return () => {
      if (cloudSyncTimeoutRef.current) {
        clearTimeout(cloudSyncTimeoutRef.current);
      }
    };
  }, [isDirty, cloudDebounceMs, syncToCloud]);

  // Initial load effect - resolve conflict between local and cloud
  useEffect(() => {
    // Wait for cloud query to complete
    if (cloudState === undefined) return;
    if (initialLoadDoneRef.current) return;

    const loadInitialState = () => {
      const localData = loadRawFromLocalStorage(projectId);

      // Convert cloud state to CanvasProjectData format
      const cloudData: CanvasProjectData | null = cloudState
        ? {
            viewport: cloudState.viewport,
            shapes: cloudState.shapes,
            tool: cloudState.tool as CanvasProjectData["tool"],
            selected: cloudState.selected,
            frameCounter: cloudState.frameCounter,
            version: cloudState.version,
            lastModified: cloudState.lastModified,
          }
        : null;

      // Resolve conflict
      const resolvedData = resolveConflict(localData, cloudData);

      if (resolvedData) {
        const deserialized = deserializeCanvasState(resolvedData);

        // Restore viewport
        dispatchViewport({
          type: "RESTORE_VIEWPORT",
          payload: deserialized.viewport,
        });

        // Restore shapes
        dispatchShapes({
          type: "LOAD_PROJECT",
          payload: {
            shapes: deserialized.shapes,
            tool: deserialized.tool,
            selected: deserialized.selected,
            frameCounter: deserialized.frameCounter,
            history: deserialized.history,
            historyPointer: deserialized.historyPointer,
          },
        });

        setLastSavedAt(resolvedData.lastModified);

        // If local was newer, queue cloud sync
        if (
          localData &&
          (!cloudData || localData.lastModified > cloudData.lastModified)
        ) {
          setIsDirty(true);
        }
      }

      initialLoadDoneRef.current = true;
      setIsLoading(false);
    };

    loadInitialState();
  }, [cloudState, projectId, dispatchViewport, dispatchShapes]);

  // Beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localSaveTimeoutRef.current)
        clearTimeout(localSaveTimeoutRef.current);
      if (cloudSyncTimeoutRef.current)
        clearTimeout(cloudSyncTimeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  // Force save function
  const forceSave = useCallback(async () => {
    saveToLocal();
    await syncToCloud();
  }, [saveToLocal, syncToCloud]);

  // Clear local data function
  const clearLocalData = useCallback(() => {
    localStorage.removeItem(`canvas-project-${projectId}`);
  }, [projectId]);

  return {
    saveStatus,
    lastSavedAt,
    isLoading,
    error,
    forceSave,
    clearLocalData,
  };
}
