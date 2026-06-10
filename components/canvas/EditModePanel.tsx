"use client";

import { useEffect, useRef } from "react";
import { MousePointer2, AlertCircle, Loader2 } from "lucide-react";
import { useEditModeContext } from "@/contexts/EditModeContext";
import { ElementPropertiesPanel } from "./ElementPropertiesPanel";

// ============================================================================
// Types
// ============================================================================

interface EditModePanelProps {
  screenId?: string;
  sandboxId?: string;
  sandboxUrl?: string;
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ hasScreen }: { hasScreen: boolean }) {
  if (!hasScreen) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-12 px-4">
        <div className="relative mb-4">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/40">
            <MousePointer2 className="h-8 w-8 text-muted-foreground/60" />
          </div>
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">
          Select a screen
        </h3>
        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
          Select a screen on the canvas to start editing elements
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 px-4">
      <div className="relative mb-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/40">
          <MousePointer2 className="h-8 w-8 text-muted-foreground/60" />
        </div>
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        Select an element
      </h3>
      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
        Click on any element in the preview to inspect and edit its styles
      </p>
    </div>
  );
}

// ============================================================================
// Error State
// ============================================================================

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 px-4">
      <div className="relative mb-4">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
          <AlertCircle className="h-8 w-8 text-destructive/60" />
        </div>
      </div>
      <h3 className="text-sm font-medium text-destructive mb-1">
        Edit mode error
      </h3>
      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
        {error}
      </p>
    </div>
  );
}

// ============================================================================
// Loading State
// ============================================================================

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 px-4">
      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
      <p className="text-xs text-muted-foreground">Enabling edit mode...</p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EditModePanel({ screenId, sandboxId }: EditModePanelProps) {
  const {
    isEditMode,
    selectedElement,
    pendingChanges,
    isSaving,
    saveError,
    hasUnsavedChanges,
    enableEditMode,
    updateStyle,
    saveChanges,
    discardChanges,
  } = useEditModeContext();

  // Track if we've already tried to enable for this sandbox
  const enableAttemptedRef = useRef<string | null>(null);

  // Auto-enable edit mode when panel mounts with valid sandbox
  useEffect(() => {
    // Only attempt to enable once per sandboxId
    if (sandboxId && !isEditMode && enableAttemptedRef.current !== sandboxId) {
      enableAttemptedRef.current = sandboxId;
      enableEditMode();
    }
    // Reset the ref if sandboxId changes
    if (!sandboxId) {
      enableAttemptedRef.current = null;
    }
  }, [sandboxId, isEditMode, enableEditMode]);

  // Note: Edit mode is disabled by EditModeProvider when tab becomes inactive

  // Show loading while enabling
  const isEnabling = sandboxId && !isEditMode && !saveError;

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {saveError && !selectedElement ? (
          <ErrorState error={saveError} />
        ) : isEnabling ? (
          <LoadingState />
        ) : !sandboxId ? (
          <EmptyState hasScreen={!!screenId} />
        ) : !selectedElement ? (
          <EmptyState hasScreen={true} />
        ) : (
          <ElementPropertiesPanel
            element={selectedElement}
            pendingChanges={pendingChanges}
            onStyleChange={updateStyle}
            onSave={saveChanges}
            onDiscard={discardChanges}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        )}
      </div>

      {/* Save Error Toast */}
      {saveError && selectedElement && (
        <div className="px-3 py-2 bg-destructive/10 border-t border-destructive/20">
          <p className="text-xs text-destructive">{saveError}</p>
        </div>
      )}
    </div>
  );
}
