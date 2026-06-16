"use client";

import { useCallback } from "react";
import { Code2, MonitorPlay } from "lucide-react";
import type { CodeExplorerProps } from "@/lib/canvas/code-explorer-types";
import { useCodeExplorer } from "@/hooks/use-code-explorer";
import { FileTree } from "./FileTree";
import { CodeViewer } from "./CodeViewer";

/**
 * CodeExplorer component - main container with split-panel layout
 */
export function CodeExplorer({
  screenId,
  sandboxId,
  cachedFiles,
  isExpanded,
}: CodeExplorerProps) {
  const {
    fileTree,
    expandedFolders,
    loadingFolders,
    folderErrors,
    selectedPath,
    fileContent,
    isLoadingContent,
    contentError,
    toggleFolder,
    selectFile,
    retryFolder,
    retryFile,
  } = useCodeExplorer({
    sandboxId,
    cachedFiles,
    enabled: isExpanded && !!sandboxId,
  });

  // Handle copy - just a no-op callback for now
  const handleCopy = useCallback(() => {
    // Could add toast notification here
  }, []);

  // No screen selected
  if (!screenId) {
    return (
      <EmptyState
        icon={MonitorPlay}
        title="Select a screen"
        description="Select a screen on the canvas to view its code"
        hint="Click on any screen shape"
      />
    );
  }

  // No sandbox session
  if (!sandboxId) {
    return (
      <EmptyState
        icon={Code2}
        title="No code yet"
        description="Generate this screen from the Chat tab to explore its code here"
        hint="Open the Chat tab"
        accentColor="primary"
      />
    );
  }

  return (
    <div className="flex h-full scrollbar-thin bg-background">
      {/* File Tree Panel - 30% width */}
      <div className="w-[30%] min-w-[180px] border-r border-border/40 overflow-auto scrollbar-thin bg-muted/20">
        <div className="px-4 py-2.5 border-b border-border/40 bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Explorer
          </span>
        </div>
        <FileTree
          sandboxId={sandboxId}
          cachedFiles={cachedFiles}
          selectedPath={selectedPath}
          onSelectFile={selectFile}
          expandedFolders={expandedFolders}
          onToggleFolder={toggleFolder}
          fileTree={fileTree}
          loadingFolders={loadingFolders}
          folderErrors={folderErrors}
          onRetryFolder={retryFolder}
        />
      </div>

      {/* Code Viewer Panel - 70% width */}
      <div className="flex-1 min-w-[200px] overflow-hidden bg-background scrollbar-thin">
        <CodeViewer
          content={fileContent}
          filePath={selectedPath}
          isLoading={isLoadingContent}
          error={contentError}
          onCopy={handleCopy}
          onRetry={retryFile}
        />
      </div>
    </div>
  );
}

/**
 * Empty state component with enhanced styling
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  hint,
  accentColor = "muted",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  hint?: string;
  accentColor?: "primary" | "muted";
}) {
  const isPrimary = accentColor === "primary";

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <Icon
        className={`mb-4 h-9 w-9 ${
          isPrimary ? "text-primary" : "text-muted-foreground/40"
        }`}
        strokeWidth={1.5}
      />

      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>

      {hint && (
        <div className="mt-5 inline-flex items-center rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {hint}
        </div>
      )}
    </div>
  );
}

export { FileTree } from "./FileTree";
export { CodeViewer } from "./CodeViewer";
