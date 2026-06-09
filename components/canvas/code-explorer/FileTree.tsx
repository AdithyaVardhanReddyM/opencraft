"use client";

import { memo } from "react";
import { ChevronRight, Loader2, AlertCircle, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  FileTreeItem,
  FileTreeProps,
} from "@/lib/canvas/code-explorer-types";
import { SANDBOX_ROOT } from "@/lib/canvas/code-explorer-types";
import { getFileIcon } from "@/lib/canvas/code-explorer-utils";
import { Button } from "@/components/ui/button";

/**
 * FileTree component - displays hierarchical file structure
 */
export function FileTree({
  sandboxId,
  cachedFiles,
  selectedPath,
  onSelectFile,
  expandedFolders,
  onToggleFolder,
  fileTree,
  loadingFolders,
  folderErrors,
  onRetryFolder,
}: FileTreeProps) {
  // Get root items
  const rootItems = fileTree.get(SANDBOX_ROOT) || [];
  const isRootLoading = loadingFolders.has(SANDBOX_ROOT);
  const rootError = folderErrors.get(SANDBOX_ROOT);

  if (isRootLoading && rootItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
          <Loader2 className="h-5 w-5 animate-spin text-primary/70 relative" />
        </div>
        <span className="text-xs text-muted-foreground/60">
          Loading files...
        </span>
      </div>
    );
  }

  if (rootError && rootItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-3 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive/70" />
        </div>
        <p className="text-xs text-foreground/80 mb-1">Failed to load</p>
        <p className="text-[10px] text-muted-foreground/60 mb-3 max-w-[160px]">
          {rootError}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRetryFolder(SANDBOX_ROOT)}
          className="h-7 text-xs px-3 border-border/50"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (rootItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center mb-3 border border-border/40">
          <FolderOpen className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <p className="text-xs text-muted-foreground/70">No files yet</p>
      </div>
    );
  }

  return (
    <div className="py-1">
      {rootItems.map((item) => (
        <FileTreeNode
          key={item.path}
          item={item}
          depth={0}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
          expandedFolders={expandedFolders}
          onToggleFolder={onToggleFolder}
          fileTree={fileTree}
          loadingFolders={loadingFolders}
          folderErrors={folderErrors}
          onRetryFolder={onRetryFolder}
        />
      ))}
    </div>
  );
}

/**
 * Props for FileTreeNode
 */
interface FileTreeNodeProps {
  item: FileTreeItem;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  fileTree: Map<string, FileTreeItem[]>;
  loadingFolders: Set<string>;
  folderErrors: Map<string, string>;
  onRetryFolder: (path: string) => void;
}

/**
 * FileTreeNode - renders a single file or folder with its children
 */
const FileTreeNode = memo(function FileTreeNode({
  item,
  depth,
  selectedPath,
  onSelectFile,
  expandedFolders,
  onToggleFolder,
  fileTree,
  loadingFolders,
  folderErrors,
  onRetryFolder,
}: FileTreeNodeProps) {
  const isFolder = item.type === "folder";
  const isExpanded = expandedFolders.has(item.path);
  const isLoading = loadingFolders.has(item.path);
  const error = folderErrors.get(item.path);
  const isSelected = selectedPath === item.path;
  const children = fileTree.get(item.path) || [];

  const iconConfig = getFileIcon(item);
  const Icon = iconConfig.icon;

  const handleClick = () => {
    if (isFolder) {
      onToggleFolder(item.path);
    } else {
      onSelectFile(item.path);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-1 text-left text-[13px]",
          "hover:bg-muted/40 transition-all duration-150 rounded-md mx-1",
          "group",
          isSelected && "bg-primary/10 text-primary hover:bg-primary/15",
          !isSelected && "text-foreground/80"
        )}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        {/* Chevron for folders */}
        {isFolder ? (
          <span className="shrink-0 w-4 h-4 flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin text-primary/60" />
            ) : (
              <ChevronRight
                className={cn(
                  "h-3 w-3 text-muted-foreground/60 transition-transform duration-150",
                  isExpanded && "rotate-90",
                  "group-hover:text-muted-foreground"
                )}
              />
            )}
          </span>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            iconConfig.className
          )}
        />

        {/* Name */}
        <span className="truncate font-normal">{item.name}</span>
      </button>

      {/* Error state */}
      {isFolder && error && (
        <div
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-destructive/80 mx-1"
          style={{ paddingLeft: `${(depth + 1) * 12 + 6}px` }}
        >
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span className="truncate">{error}</span>
          <button
            onClick={() => onRetryFolder(item.path)}
            className="text-primary/80 hover:text-primary hover:underline ml-1 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Children */}
      {isFolder && isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <FileTreeNode
              key={child.path}
              item={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              fileTree={fileTree}
              loadingFolders={loadingFolders}
              folderErrors={folderErrors}
              onRetryFolder={onRetryFolder}
            />
          ))}
        </div>
      )}

      {/* Empty folder */}
      {isFolder &&
        isExpanded &&
        children.length === 0 &&
        !isLoading &&
        !error && (
          <div
            className="px-2 py-0.5 text-[11px] text-muted-foreground/40 italic mx-1"
            style={{ paddingLeft: `${(depth + 1) * 12 + 6}px` }}
          >
            Empty
          </div>
        )}
    </div>
  );
});
