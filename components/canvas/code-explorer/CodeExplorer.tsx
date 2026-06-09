"use client";

import { useCallback } from "react";
import { Code2, Sparkles, MonitorPlay, Wand2 } from "lucide-react";
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
        icon={Wand2}
        title="No code yet"
        description="Start a conversation with AI to generate code for this screen"
        hint="Try the Chat tab"
        accentColor="primary"
      />
    );
  }

  return (
    <div className="flex h-full scrollbar-thin">
      {/* File Tree Panel - 30% width */}
      <div className="w-[30%] min-w-[180px] border-r border-border/40 overflow-auto scrollbar-thin">
        <div className="px-4 py-2.5 border-b border-border/40 bg-muted/10 sticky top-0 z-10 backdrop-blur-sm">
          <span className="text-xs font-medium text-foreground/70">
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
      <div className="flex-1 min-w-[200px] overflow-hidden bg-muted/10 scrollbar-thin">
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
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute top-1/3 left-1/3 w-40 h-40 rounded-full blur-3xl ${
            isPrimary ? "bg-primary/8" : "bg-muted/30"
          }`}
        />
        <div className="absolute bottom-1/4 right-1/3 w-32 h-32 bg-muted/20 rounded-full blur-2xl" />
      </div>

      {/* Icon container */}
      <div className="relative mb-5">
        <div
          className={`absolute inset-0 rounded-2xl blur-xl scale-150 opacity-40 ${
            isPrimary ? "bg-primary/20" : "bg-muted/40"
          }`}
        />
        <div
          className={`relative h-16 w-16 rounded-2xl flex items-center justify-center border shadow-lg ${
            isPrimary
              ? "bg-linear-to-br from-primary/20 to-primary/5 border-primary/20"
              : "bg-linear-to-br from-muted/80 to-muted/40 border-border/50"
          }`}
        >
          <Icon
            className={`h-8 w-8 ${
              isPrimary ? "text-primary/70" : "text-muted-foreground/60"
            }`}
          />
        </div>
      </div>

      {/* Text content */}
      <h3 className="text-sm font-medium text-foreground/90 mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground/70 max-w-[220px] leading-relaxed">
        {description}
      </p>

      {/* Hint badge */}
      {hint && (
        <div
          className={`mt-5 px-3 py-1.5 rounded-full border ${
            isPrimary
              ? "bg-primary/10 border-primary/20"
              : "bg-muted/30 border-border/30"
          }`}
        >
          <span
            className={`text-[10px] font-medium ${
              isPrimary ? "text-primary/80" : "text-muted-foreground/60"
            }`}
          >
            {hint}
          </span>
        </div>
      )}
    </div>
  );
}

export { FileTree } from "./FileTree";
export { CodeViewer } from "./CodeViewer";
