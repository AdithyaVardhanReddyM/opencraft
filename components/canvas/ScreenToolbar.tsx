"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { ScreenShape, ViewportState } from "@/types/canvas";
import { useSandboxResume } from "@/hooks/use-sandbox-resume";
import {
  DEVICE_PRESETS,
  getCurrentDevicePreset,
  TOOLBAR_HEIGHT,
  TOOLBAR_GAP,
  type DevicePreset,
} from "@/lib/canvas/toolbar-utils";
import {
  Monitor,
  ExternalLink,
  RefreshCw,
  Trash2,
  Loader2,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ScreenToolbarProps {
  shape: ScreenShape;
  screenData?: {
    _id: Id<"screens">;
    sandboxUrl?: string;
    sandboxId?: string;
    title?: string;
  };
  viewport: ViewportState;
  onDelete: () => void;
  onResize: (width: number, height: number) => void;
  onRefresh: () => void;
}

export function ScreenToolbar({
  shape,
  screenData,
  viewport,
  onDelete,
  onResize,
  onRefresh,
}: ScreenToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(screenData?.title || "Untitled");
  const [isSaving, setIsSaving] = useState(false);

  // Device dropdown state
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);

  // Sandbox state
  const { status, resume } = useSandboxResume({
    sandboxId: screenData?.sandboxId,
    sandboxUrl: screenData?.sandboxUrl,
    autoResume: true,
  });

  // Convex mutation for updating screen title
  const updateScreen = useMutation(api.screens.updateScreen);

  // Sync edited name with screen data
  useEffect(() => {
    if (!isEditingName) {
      setEditedName(screenData?.title || "Untitled");
    }
  }, [screenData?.title, isEditingName]);

  // Get current device preset
  const currentPreset = getCurrentDevicePreset(shape);

  // Handle name save
  const handleNameSave = useCallback(async () => {
    const trimmedName = editedName.trim();

    // Validate: prevent empty names
    if (!trimmedName) {
      setEditedName(screenData?.title || "Untitled");
      setIsEditingName(false);
      return;
    }

    // Skip if name hasn't changed
    if (trimmedName === screenData?.title) {
      setIsEditingName(false);
      return;
    }

    // Save to Convex
    if (screenData?._id) {
      setIsSaving(true);
      try {
        await updateScreen({
          screenId: screenData._id,
          title: trimmedName,
        });
      } catch (error) {
        console.error("Failed to save screen name:", error);
        setEditedName(screenData?.title || "Untitled");
      } finally {
        setIsSaving(false);
      }
    }

    setIsEditingName(false);
  }, [editedName, screenData, updateScreen]);

  // Handle name input key down
  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleNameSave();
      } else if (e.key === "Escape") {
        setEditedName(screenData?.title || "Untitled");
        setIsEditingName(false);
      }
    },
    [handleNameSave, screenData?.title]
  );

  // Handle device preset selection
  const handleDeviceSelect = useCallback(
    (preset: DevicePreset) => {
      onResize(preset.width, preset.height);
      setIsDeviceDropdownOpen(false);
    },
    [onResize]
  );

  // Handle preview click
  const handlePreview = useCallback(async () => {
    if (status === "expired" || status === "idle") return;

    if (status === "ready" && screenData?.sandboxUrl) {
      window.open(screenData.sandboxUrl, "_blank");
      return;
    }

    // If resuming or checking, wait for ready
    if (status === "resuming" || status === "checking") {
      // The hook will auto-resume, we just need to wait
      return;
    }

    // If paused/error, try to resume first
    await resume();
    if (screenData?.sandboxUrl) {
      window.open(screenData.sandboxUrl, "_blank");
    }
  }, [status, screenData?.sandboxUrl, resume]);

  // Determine button states
  const isLoading = status === "resuming" || status === "checking";
  const isExpired = status === "expired";
  const isError = status === "error";
  const isIdle = status === "idle" && !screenData?.sandboxId;
  const canPreview = status === "ready" && !!screenData?.sandboxUrl;
  const canRefresh = status === "ready";

  // Get preview tooltip text
  const getPreviewTooltip = () => {
    if (isExpired) return "Sandbox expired";
    if (isIdle) return "No preview available";
    if (isLoading) return "Resuming sandbox...";
    return "Open in new tab";
  };

  // Get refresh tooltip text
  const getRefreshTooltip = () => {
    if (!canRefresh) return "Sandbox not ready";
    return "Refresh preview";
  };

  // Get current device icon
  const DeviceIcon = currentPreset?.icon || Monitor;

  // Calculate inverse scale to keep toolbar at consistent size
  const inverseScale = 1 / viewport.scale;

  // Position toolbar centered above the shape
  // We position at shape center X, and above shape Y
  const toolbarX = shape.x + shape.w / 2;
  const toolbarY = shape.y - TOOLBAR_GAP / viewport.scale;

  return (
    <div
      ref={toolbarRef}
      className="absolute flex items-center gap-0.5 px-1.5 py-1 bg-card/95 rounded-lg backdrop-blur-2xl saturate-150"
      style={{
        left: toolbarX,
        top: toolbarY,
        minHeight: TOOLBAR_HEIGHT,
        transform: `translate(-50%, -100%) scale(${inverseScale})`,
        transformOrigin: "center bottom",
        boxShadow:
          "0 4px 24px -4px oklch(0 0 0 / 0.5), 0 8px 16px -8px oklch(0 0 0 / 0.3)",
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Device Preset Dropdown */}
      <Popover
        open={isDeviceDropdownOpen}
        onOpenChange={setIsDeviceDropdownOpen}
      >
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-1 h-8 px-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
            aria-label="Change device size"
          >
            <DeviceIcon className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="start" sideOffset={8}>
          {DEVICE_PRESETS.map((preset) => {
            const PresetIcon = preset.icon;
            const isActive = currentPreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                className={cn(
                  "flex items-center gap-3 w-full px-2.5 py-2 rounded-md text-left transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => handleDeviceSelect(preset)}
              >
                <PresetIcon className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{preset.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {preset.width} × {preset.height}
                  </div>
                </div>
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      {/* Divider */}
      <div className="h-5 w-px bg-border/50 mx-1" aria-hidden />

      {/* Screen Name Input */}
      <div className="flex-1 min-w-[120px] max-w-[200px]">
        {isEditingName ? (
          <input
            ref={inputRef}
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
            className="w-full h-8 px-2 text-sm bg-accent rounded-md border-none outline-none focus:ring-2 focus:ring-primary text-foreground"
            autoFocus
          />
        ) : (
          <button
            className="w-full h-8 px-2 text-sm text-left text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors truncate"
            onClick={() => setIsEditingName(true)}
          >
            {isSaving ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            ) : (
              screenData?.title || "Untitled"
            )}
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border/50 mx-1" aria-hidden />

      {/* Action Buttons */}
      {isLoading ? (
        <div className="flex items-center gap-2 px-2 h-8">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Resuming...</span>
        </div>
      ) : isExpired ? (
        <div className="flex items-center gap-2 px-2 h-8">
          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          <span className="text-xs text-muted-foreground">Expired</span>
        </div>
      ) : isError ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex items-center gap-1 h-8 px-2 rounded-md text-destructive hover:bg-accent transition-colors"
              onClick={resume}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-xs">Retry</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Resume sandbox</TooltipContent>
        </Tooltip>
      ) : (
        <>
          {/* Preview Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  canPreview
                    ? "text-foreground hover:bg-accent hover:text-accent-foreground"
                    : "text-muted-foreground/40 cursor-not-allowed"
                )}
                onClick={handlePreview}
                disabled={!canPreview && !isLoading}
                aria-label="Preview in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{getPreviewTooltip()}</TooltipContent>
          </Tooltip>

          {/* Refresh Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  canRefresh
                    ? "text-foreground hover:bg-accent hover:text-accent-foreground"
                    : "text-muted-foreground/40 cursor-not-allowed"
                )}
                onClick={onRefresh}
                disabled={!canRefresh}
                aria-label="Refresh preview"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{getRefreshTooltip()}</TooltipContent>
          </Tooltip>
        </>
      )}

      {/* Divider */}
      <div className="h-5 w-px bg-border/50 mx-1" aria-hidden />

      {/* Delete Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={onDelete}
            aria-label="Delete screen"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Delete screen</TooltipContent>
      </Tooltip>
    </div>
  );
}
