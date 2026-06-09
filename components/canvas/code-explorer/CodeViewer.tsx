"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Copy,
  Check,
  RefreshCw,
  FileCode2,
  Loader2,
  MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { CodeViewerProps } from "@/lib/canvas/code-explorer-types";
import { getLanguageFromPath } from "@/lib/canvas/code-explorer-utils";
import { codeToHtml, type BundledLanguage } from "shiki";

/**
 * CodeViewer component - displays file content with syntax highlighting
 */
export function CodeViewer({
  content,
  filePath,
  isLoading,
  error,
  onCopy,
  onRetry,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");
  const [isHighlighting, setIsHighlighting] = useState(false);
  const mountedRef = useRef(true);

  // Get filename from path
  const fileName = filePath ? filePath.split("/").pop() : null;

  // Handle copy
  const handleCopy = useCallback(async () => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [content, onCopy]);

  // Highlight code when content changes
  useEffect(() => {
    mountedRef.current = true;

    if (!content || !filePath) {
      setHighlightedHtml("");
      return;
    }

    const highlight = async () => {
      setIsHighlighting(true);

      try {
        const language = getLanguageFromPath(filePath) as BundledLanguage;

        const html = await codeToHtml(content, {
          lang: language,
          theme: "one-dark-pro",
        });

        if (mountedRef.current) {
          setHighlightedHtml(html);
        }
      } catch (err) {
        console.error("Failed to highlight code:", err);
        // Fallback to plain text
        if (mountedRef.current) {
          setHighlightedHtml("");
        }
      } finally {
        if (mountedRef.current) {
          setIsHighlighting(false);
        }
      }
    };

    highlight();

    return () => {
      mountedRef.current = false;
    };
  }, [content, filePath]);

  // Empty state - no file selected
  if (!filePath && !isLoading && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-muted/20 rounded-full blur-2xl" />
        </div>

        {/* Icon container with glow effect */}
        <div className="relative mb-5">
          <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl scale-150 opacity-50" />
          <div className="relative h-16 w-16 rounded-2xl bg-linear-to-br from-muted/80 to-muted/40 flex items-center justify-center border border-border/50 shadow-lg">
            <FileCode2 className="h-8 w-8 text-muted-foreground/70" />
          </div>
        </div>

        {/* Text content */}
        <h3 className="text-sm font-medium text-foreground/90 mb-1.5">
          No file selected
        </h3>
        <p className="text-xs text-muted-foreground/70 max-w-[200px] leading-relaxed">
          Click on a file in the explorer to view its contents
        </p>

        {/* Hint with icon */}
        <div className="mt-5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/30">
          <MousePointerClick className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-[10px] text-muted-foreground/60">
            Select from the file tree
          </span>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        {fileName && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/10">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
              <span className="text-xs font-medium text-foreground/80 truncate">
                {fileName}
              </span>
            </div>
          </div>
        )}
        {/* Loading content */}
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
            <Loader2 className="h-6 w-6 animate-spin text-primary/70 relative" />
          </div>
          <span className="text-xs text-muted-foreground/60">
            Loading file...
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        {fileName && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/10">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-destructive/60" />
              <span className="text-xs font-medium text-foreground/80 truncate">
                {fileName}
              </span>
            </div>
          </div>
        )}
        {/* Error content */}
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
          <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4 border border-destructive/20">
            <RefreshCw className="h-5 w-5 text-destructive/70" />
          </div>
          <p className="text-sm text-foreground/80 mb-1">Failed to load file</p>
          <p className="text-xs text-muted-foreground/60 mb-4 max-w-[240px]">
            {error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2 text-xs h-8 px-3 border-border/50 hover:bg-muted/50"
          >
            <RefreshCw className="h-3 w-3" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Content view
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500/70" />
          <span className="text-xs font-medium text-foreground/80 truncate">
            {fileName}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-muted/50"
          onClick={handleCopy}
          title="Copy file content"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground/70" />
          )}
        </Button>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto scrollbar-thin bg-[#282c34]/30">
        {isHighlighting ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50" />
          </div>
        ) : highlightedHtml ? (
          <div
            className={cn(
              "text-sm [&>pre]:m-0 [&>pre]:p-4 [&>pre]:bg-transparent!",
              "[&>pre]:overflow-x-auto [&_code]:font-mono [&_code]:text-[13px] [&_code]:leading-relaxed",
              "scrollbar-thin"
            )}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <pre className="p-4 text-[13px] font-mono leading-relaxed whitespace-pre-wrap break-all text-foreground/80">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}
