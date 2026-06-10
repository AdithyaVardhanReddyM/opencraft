"use client";

import { Save, X, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SelectedElementInfo, StyleChanges } from "@/lib/edit-mode/types";
import { getElementCategory } from "@/lib/edit-mode/types";
import {
  LayoutSection,
  TypographySection,
  AppearanceSection,
  ImageSection,
} from "./edit-mode";

// ============================================================================
// Types
// ============================================================================

interface ElementPropertiesPanelProps {
  element: SelectedElementInfo;
  pendingChanges: StyleChanges | null;
  onStyleChange: (property: string, value: string) => void;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function ElementPropertiesPanel({
  element,
  pendingChanges,
  onStyleChange,
  onSave,
  onDiscard,
  isSaving,
  hasUnsavedChanges,
}: ElementPropertiesPanelProps) {
  const { computedStyles, tagName, textContent } = element;

  // Determine element category
  const category = getElementCategory(tagName);

  // Track which properties have been modified
  const modifiedProperties = pendingChanges ? Object.keys(pendingChanges) : [];

  // Handle image src change (special case for img elements)
  const handleImageSrcChange = (src: string) => {
    // For images, we need to handle src attribute differently
    // This will be sent via postMessage to update the DOM
    onStyleChange("src", src);
  };

  // Get current image src from element (would need to be passed from overlay)
  const currentImageSrc = element.dataAttributes?.src || "";

  return (
    <div className="flex flex-col h-full">
      {/* Save/Discard Header Bar */}
      <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-mono bg-muted/50 rounded">
            {tagName}
          </span>
          {hasUnsavedChanges && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded">
                    <Circle className="h-1.5 w-1.5 fill-current" />
                    Modified
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {modifiedProperties.length} property
                    {modifiedProperties.length !== 1 ? "ies" : "y"} changed
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDiscard}
                    disabled={isSaving}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Discard changes</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={onSave}
                    disabled={isSaving}
                    className="h-7 px-3 text-xs"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save changes to source file</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Layout Section - shown for all element types */}
        <LayoutSection
          computedStyles={computedStyles}
          pendingChanges={pendingChanges}
          onStyleChange={onStyleChange}
        />

        {/* Typography Section - shown for text elements */}
        {(category === "text" || category === "other") && (
          <TypographySection
            computedStyles={computedStyles}
            pendingChanges={pendingChanges}
            onStyleChange={onStyleChange}
            textContent={textContent}
          />
        )}

        {/* Appearance Section - shown for all element types */}
        <AppearanceSection
          computedStyles={computedStyles}
          pendingChanges={pendingChanges}
          onStyleChange={onStyleChange}
        />

        {/* Image Section - shown only for img elements */}
        {category === "image" && (
          <ImageSection
            currentSrc={currentImageSrc}
            onSrcChange={handleImageSrcChange}
          />
        )}
      </div>
    </div>
  );
}
