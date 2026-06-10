"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SelectedElementInfo,
  HoveredElementInfo,
  StyleChanges,
  IframeToParentMessage,
  ParentToIframeMessage,
} from "@/lib/edit-mode/types";
import { isEditModeMessage } from "@/lib/edit-mode/types";
import {
  cssToTailwind,
  updateElementClassName,
} from "@/lib/edit-mode/style-mapper";
import {
  writeSourceFile,
  readSourceFile,
  generateUniqueSelector,
} from "@/lib/edit-mode";

// ======================
// Types
// ======================

export interface UseEditModeOptions {
  sandboxId?: string;
  screenId?: string;
  sandboxUrl?: string;
}

export interface UseEditModeReturn {
  isEditMode: boolean;
  selectedElement: SelectedElementInfo | null;
  hoveredElement: HoveredElementInfo | null;
  pendingChanges: StyleChanges | null;
  isSaving: boolean;
  saveError: string | null;
  hasUnsavedChanges: boolean;
  enableEditMode: () => Promise<void>;
  disableEditMode: () => Promise<void>;
  updateStyle: (property: string, value: string) => void;
  saveChanges: () => Promise<void>;
  discardChanges: () => void;
}

// ======================
// Hook Implementation
// ======================

export function useEditMode({
  sandboxId,
}: UseEditModeOptions): UseEditModeReturn {
  // State
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElement, setSelectedElement] =
    useState<SelectedElementInfo | null>(null);
  const [hoveredElement, setHoveredElement] =
    useState<HoveredElementInfo | null>(null);
  const [pendingChanges, setPendingChanges] = useState<StyleChanges | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Refs
  const isEnablingRef = useRef(false);
  const isDisablingRef = useRef(false);
  const previousSandboxIdRef = useRef<string | undefined>(undefined);

  // Reset state when sandboxId changes
  useEffect(() => {
    if (sandboxId !== previousSandboxIdRef.current) {
      previousSandboxIdRef.current = sandboxId;
      // Reset refs and state for new sandbox
      isEnablingRef.current = false;
      isDisablingRef.current = false;
      setIsEditMode(false);
      setSelectedElement(null);
      setHoveredElement(null);
      setPendingChanges(null);
      setSaveError(null);
    }
  }, [sandboxId]);

  // Computed
  const hasUnsavedChanges =
    pendingChanges !== null && Object.keys(pendingChanges).length > 0;

  // ======================
  // Send Message to Iframe (defined first so it can be used by handleMessage)
  // ======================

  const getIframe = useCallback(() => {
    // Log all sandbox iframes for debugging
    const allIframes = document.querySelectorAll<HTMLIFrameElement>(
      'iframe[data-sandbox-preview="true"]'
    );
    console.log("[useEditMode] Found", allIframes.length, "sandbox iframes");
    allIframes.forEach((iframe, i) => {
      console.log(`[useEditMode] Iframe ${i}:`, {
        sandboxId: iframe.dataset.sandboxId,
        src: iframe.src?.substring(0, 100),
      });
    });

    // Try to find iframe by sandboxId first
    if (sandboxId) {
      const byId = document.querySelector<HTMLIFrameElement>(
        `iframe[data-sandbox-id="${sandboxId}"]`
      );
      if (byId) {
        console.log("[useEditMode] Found iframe by sandboxId:", sandboxId);
        return byId;
      }
      console.log("[useEditMode] No iframe found with sandboxId:", sandboxId);
    }
    // Fallback to any sandbox preview iframe
    const fallback = document.querySelector<HTMLIFrameElement>(
      'iframe[data-sandbox-preview="true"]'
    );
    if (fallback) {
      console.log(
        "[useEditMode] Using fallback iframe with sandboxId:",
        fallback.dataset.sandboxId
      );
    }
    return fallback;
  }, [sandboxId]);

  const sendToIframe = useCallback(
    (message: ParentToIframeMessage) => {
      const iframe = getIframe();

      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(message, "*");
        console.log(
          "[useEditMode] Sent message to iframe:",
          message.type,
          "sandboxId:",
          sandboxId
        );
      } else {
        console.warn("[useEditMode] No iframe found for sandboxId:", sandboxId);
      }
    },
    [sandboxId, getIframe]
  );

  // ======================
  // Message Handling
  // ======================

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      if (!isEditModeMessage(event.data)) return;

      const message = event.data as IframeToParentMessage;

      switch (message.type) {
        case "element-hovered":
          setHoveredElement(message.data);
          break;
        case "element-unhovered":
          setHoveredElement(null);
          break;
        case "element-selected":
          setSelectedElement(message.data);
          setPendingChanges(null);
          setSaveError(null);
          break;
        case "element-deselected":
          setSelectedElement(null);
          setPendingChanges(null);
          setSaveError(null);
          break;
        case "edit-mode-script-loaded":
          // Script is loaded, send enable command
          console.log("[useEditMode] Script loaded, sending enable command");
          sendToIframe({ type: "enable-edit-mode" });
          break;
        case "edit-mode-ready":
          console.log("[useEditMode] Edit mode ready in iframe");
          setIsEditMode(true);
          break;
        case "edit-mode-error":
          console.error("[useEditMode] Edit mode error:", message.error);
          setSaveError(message.error);
          break;
      }
    },
    [sendToIframe]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // ======================
  // Enable/Disable Edit Mode
  // ======================

  const enableEditMode = useCallback(async () => {
    if (!sandboxId || isEnablingRef.current || isEditMode) return;

    isEnablingRef.current = true;
    setSaveError(null);

    try {
      // Call API to inject overlay script into sandbox
      const response = await fetch("/api/sandbox/edit-mode/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to enable edit mode");
      }

      // Find the iframe for this specific sandbox
      const iframe = getIframe();

      if (!iframe) {
        console.warn("[useEditMode] No sandbox iframe found for:", sandboxId);
        throw new Error("No sandbox preview found");
      }

      console.log(
        "[useEditMode] Found iframe for sandbox:",
        sandboxId,
        "iframe sandboxId:",
        iframe.dataset.sandboxId,
        "src:",
        iframe.src
      );

      // Force iframe to reload to pick up the modified layout with the script
      // The script will auto-enable when it sees __editMode__=true in URL
      const currentSrc = iframe.src;
      const url = new URL(currentSrc);
      url.searchParams.set("__editMode__", "true");
      url.searchParams.set("__t__", Date.now().toString());

      console.log("[useEditMode] Reloading iframe with:", url.toString());
      iframe.src = url.toString();

      // Wait for iframe to reload and script to initialize
      // Send multiple enable messages to ensure the iframe receives it
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        sendToIframe({ type: "enable-edit-mode" });
        console.log(`[useEditMode] Sent enable message attempt ${i + 1}`);
      }

      console.log(
        "[useEditMode] Enable messages sent, waiting for edit-mode-ready from iframe"
      );
    } catch (error) {
      console.error("[useEditMode] Failed to enable edit mode:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to enable edit mode"
      );
    } finally {
      isEnablingRef.current = false;
    }
  }, [sandboxId, isEditMode, sendToIframe, getIframe]);

  const disableEditMode = useCallback(async () => {
    if (!sandboxId || isDisablingRef.current || !isEditMode) return;

    isDisablingRef.current = true;
    console.log("[useEditMode] Disabling edit mode for:", sandboxId);

    try {
      // Send disable message to iframe first
      sendToIframe({ type: "disable-edit-mode" });

      // Refresh iframe to remove __editMode__ from URL
      const iframe = getIframe();
      if (iframe) {
        try {
          const currentSrc = iframe.src;
          if (currentSrc) {
            const url = new URL(currentSrc);
            url.searchParams.delete("__editMode__");
            url.searchParams.delete("__t__");
            iframe.src = url.toString();
            console.log(
              "[useEditMode] Refreshed iframe without edit mode params"
            );
          }
        } catch (e) {
          console.warn("[useEditMode] Failed to refresh iframe:", e);
        }
      }

      // Call API to remove overlay script
      const response = await fetch("/api/sandbox/edit-mode/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId }),
      });

      const data = await response.json();

      if (!data.success) {
        console.warn("[useEditMode] Failed to disable edit mode:", data.error);
      }

      // Reset state
      setIsEditMode(false);
      setSelectedElement(null);
      setHoveredElement(null);
      setPendingChanges(null);
      setSaveError(null);
    } catch (error) {
      console.error("[useEditMode] Failed to disable edit mode:", error);
      // Reset state anyway
      setIsEditMode(false);
      setSelectedElement(null);
      setHoveredElement(null);
      setPendingChanges(null);
    } finally {
      isDisablingRef.current = false;
    }
  }, [sandboxId, isEditMode, sendToIframe, getIframe]);

  // ======================
  // Style Updates
  // ======================

  const updateStyle = useCallback(
    (property: string, value: string) => {
      if (!selectedElement) return;

      // Apply style to DOM immediately via postMessage
      sendToIframe({ type: "apply-style", property, value });

      // Track pending change
      setPendingChanges((prev) => ({
        ...prev,
        [property]: value,
      }));

      // Clear any previous save error
      setSaveError(null);
    },
    [selectedElement, sendToIframe]
  );

  // ======================
  // Save Changes
  // ======================

  const saveChanges = useCallback(async () => {
    if (!sandboxId || !selectedElement || !pendingChanges || isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Convert pending changes to Tailwind classes
      const tailwindClasses = cssToTailwind(pendingChanges);

      if (tailwindClasses.length === 0) {
        setPendingChanges(null);
        setIsSaving(false);
        return;
      }

      // Generate unique selector for the element
      const uniqueSelector = generateUniqueSelector(selectedElement);
      console.log(
        "[useEditMode] Generated unique selector:",
        uniqueSelector.selector,
        "confidence:",
        uniqueSelector.confidence,
        "method:",
        uniqueSelector.method
      );

      // Determine source file path
      const sourceFilePath = selectedElement.sourceFile || "app/page.tsx";

      // Read the source file
      const sourceContent = await readSourceFile(sandboxId, sourceFilePath);

      // Update the className in the source using the unique selector
      // For high-confidence selectors (ID or data-attr), we can target more precisely
      const updatedContent = updateElementClassName(
        sourceContent,
        uniqueSelector.method === "id" || uniqueSelector.method === "data-attr"
          ? uniqueSelector.selector
          : selectedElement.elementPath,
        tailwindClasses
      );

      // Write back to sandbox
      await writeSourceFile(sandboxId, sourceFilePath, updatedContent);

      // Verify the changes were written correctly
      try {
        const verifyContent = await readSourceFile(sandboxId, sourceFilePath);
        const hasChanges = tailwindClasses.some((cls) =>
          verifyContent.includes(cls)
        );
        if (!hasChanges) {
          console.warn(
            "[useEditMode] Verification warning: Changes may not have been persisted correctly"
          );
        } else {
          console.log("[useEditMode] Changes verified successfully");
        }
      } catch (verifyError) {
        console.warn("[useEditMode] Could not verify changes:", verifyError);
      }

      // Clear pending changes on success
      setPendingChanges(null);

      console.log("[useEditMode] Changes saved successfully");
    } catch (error) {
      console.error("[useEditMode] Failed to save changes:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to save changes"
      );
    } finally {
      setIsSaving(false);
    }
  }, [sandboxId, selectedElement, pendingChanges, isSaving]);

  // ======================
  // Discard Changes
  // ======================

  const discardChanges = useCallback(() => {
    if (!selectedElement || !pendingChanges) return;

    // Revert DOM changes by deselecting
    sendToIframe({ type: "deselect" });

    // Clear pending changes
    setPendingChanges(null);
    setSaveError(null);
  }, [selectedElement, pendingChanges, sendToIframe]);

  // ======================
  // Cleanup on unmount
  // ======================

  useEffect(() => {
    // Store current values for cleanup
    const currentSandboxId = sandboxId;
    const currentIsEditMode = isEditMode;

    return () => {
      if (currentIsEditMode && currentSandboxId) {
        console.log(
          "[useEditMode] Cleanup: disabling edit mode for",
          currentSandboxId
        );

        // Send disable message to iframe
        const iframe =
          document.querySelector<HTMLIFrameElement>(
            `iframe[data-sandbox-id="${currentSandboxId}"]`
          ) ||
          document.querySelector<HTMLIFrameElement>(
            'iframe[data-sandbox-preview="true"]'
          );

        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: "disable-edit-mode" }, "*");
          console.log("[useEditMode] Sent disable message to iframe");

          // Also refresh the iframe to remove __editMode__ from URL
          try {
            const currentSrc = iframe.src;
            if (currentSrc) {
              const url = new URL(currentSrc);
              url.searchParams.delete("__editMode__");
              url.searchParams.delete("__t__");
              iframe.src = url.toString();
              console.log(
                "[useEditMode] Refreshed iframe without edit mode params"
              );
            }
          } catch (e) {
            console.warn("[useEditMode] Failed to refresh iframe:", e);
          }
        }

        // Call API to remove overlay script
        fetch("/api/sandbox/edit-mode/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sandboxId: currentSandboxId }),
        }).catch(console.error);
      }
    };
  }, [isEditMode, sandboxId]);

  return {
    isEditMode,
    selectedElement,
    hoveredElement,
    pendingChanges,
    isSaving,
    saveError,
    hasUnsavedChanges,
    enableEditMode,
    disableEditMode,
    updateStyle,
    saveChanges,
    discardChanges,
  };
}
