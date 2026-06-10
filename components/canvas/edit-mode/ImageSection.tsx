"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ImageSectionProps {
  currentSrc: string;
  onSrcChange: (src: string) => void;
}

// ============================================================================
// URL Validation
// ============================================================================

function isValidUrl(str: string): boolean {
  if (!str || str.trim() === "") return false;

  try {
    // Check for relative URLs (starting with / or ./)
    if (str.startsWith("/") || str.startsWith("./") || str.startsWith("../")) {
      return true;
    }

    // Check for data URLs
    if (str.startsWith("data:image/")) {
      return true;
    }

    // Check for absolute URLs
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getUrlError(str: string): string | null {
  if (!str || str.trim() === "") {
    return "URL is required";
  }

  if (!isValidUrl(str)) {
    return "Invalid URL format. Use http://, https://, or a relative path";
  }

  return null;
}

// ============================================================================
// Main Component
// ============================================================================

export function ImageSection({ currentSrc, onSrcChange }: ImageSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [inputValue, setInputValue] = useState(currentSrc);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Sync input value with prop
  useEffect(() => {
    setInputValue(currentSrc);
    setError(null);
    setPreviewError(false);
  }, [currentSrc]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setError(null);
    setPreviewError(false);
  };

  const handleApply = () => {
    const urlError = getUrlError(inputValue);
    if (urlError) {
      setError(urlError);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Test if the image loads
    const img = new window.Image();
    img.onload = () => {
      setIsLoading(false);
      setPreviewError(false);
      onSrcChange(inputValue);
    };
    img.onerror = () => {
      setIsLoading(false);
      setPreviewError(true);
      // Still apply the change, but show warning
      onSrcChange(inputValue);
    };
    img.src = inputValue;

    // Timeout fallback
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        onSrcChange(inputValue);
      }
    }, 5000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  return (
    <div className="border-b border-border/40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <ImageIcon className="h-3 w-3" />
        Image Source
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-3">
          {/* Preview */}
          <div className="relative aspect-video bg-muted/30 rounded-md border border-border/40 overflow-hidden">
            {currentSrc ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentSrc}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  onError={() => setPreviewError(true)}
                />
                {previewError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                    <div className="text-center">
                      <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">
                        Failed to load
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">No image</p>
                </div>
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* URL Input */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Image URL</Label>
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com/image.jpg"
                className={cn(
                  "h-8 text-xs flex-1",
                  error && "border-destructive focus-visible:ring-destructive"
                )}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={handleApply}
                      disabled={isLoading}
                      className="h-8 px-3"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Apply image URL</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
            {previewError && !error && (
              <p className="text-xs text-amber-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Image may not load correctly
              </p>
            )}
          </div>

          {/* Current URL Display */}
          {currentSrc && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Current</Label>
              <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-md border border-border/30">
                <p className="text-xs text-muted-foreground truncate flex-1 font-mono">
                  {currentSrc}
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => window.open(currentSrc, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open in new tab</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
