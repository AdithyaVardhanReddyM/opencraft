import type { LucideIcon } from "lucide-react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import type { ScreenShape, ViewportState } from "@/types/canvas";

/**
 * Gap between toolbar and screen shape (in pixels)
 */
export const TOOLBAR_GAP = 8;

/**
 * Toolbar dimensions for position calculation
 */
export const TOOLBAR_HEIGHT = 44;
export const TOOLBAR_MIN_WIDTH = 320;

/**
 * Device preset interface
 */
export interface DevicePreset {
  id: "desktop" | "tablet" | "mobile";
  label: string;
  icon: LucideIcon;
  width: number;
  height: number;
}

/**
 * Predefined device size presets
 */
export const DEVICE_PRESETS: DevicePreset[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: 1440, height: 1024 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: 1133, height: 744 },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: 402, height: 874 },
];

/**
 * Toolbar position in screen coordinates
 */
export interface ToolbarPosition {
  x: number;
  y: number;
}

/**
 * Calculate the toolbar position in screen coordinates based on shape and viewport
 *
 * @param shape - The screen shape to position toolbar above
 * @param viewport - Current viewport state (scale and translate)
 * @param toolbarWidth - Width of the toolbar in pixels
 * @param toolbarHeight - Height of the toolbar in pixels (defaults to TOOLBAR_HEIGHT)
 * @returns Position in screen coordinates
 */
export function calculateToolbarPosition(
  shape: ScreenShape,
  viewport: ViewportState,
  toolbarWidth: number = TOOLBAR_MIN_WIDTH,
  toolbarHeight: number = TOOLBAR_HEIGHT
): ToolbarPosition {
  // Convert shape world coordinates to screen coordinates
  const screenX = shape.x * viewport.scale + viewport.translate.x;
  const screenY = shape.y * viewport.scale + viewport.translate.y;
  const screenWidth = shape.w * viewport.scale;

  // Center toolbar above shape with gap
  return {
    x: screenX + screenWidth / 2 - toolbarWidth / 2,
    y: screenY - toolbarHeight - TOOLBAR_GAP,
  };
}

/**
 * Calculate the toolbar position in world coordinates (for rendering inside transform container)
 *
 * @param shape - The screen shape to position toolbar above
 * @param toolbarWidth - Width of the toolbar in pixels (will be scaled)
 * @param toolbarHeight - Height of the toolbar in pixels (will be scaled)
 * @param scale - Current viewport scale
 * @returns Position in world coordinates
 */
export function calculateToolbarWorldPosition(
  shape: ScreenShape,
  toolbarWidth: number = TOOLBAR_MIN_WIDTH,
  toolbarHeight: number = TOOLBAR_HEIGHT,
  scale: number = 1
): ToolbarPosition {
  // Calculate unscaled toolbar dimensions
  const unscaledWidth = toolbarWidth / scale;
  const unscaledHeight = toolbarHeight / scale;
  const unscaledGap = TOOLBAR_GAP / scale;

  // Center toolbar above shape in world coordinates
  return {
    x: shape.x + shape.w / 2 - unscaledWidth / 2,
    y: shape.y - unscaledHeight - unscaledGap,
  };
}

/**
 * Get the current device preset based on shape dimensions
 * Returns the preset that matches the shape dimensions, or null if no match
 */
export function getCurrentDevicePreset(
  shape: ScreenShape
): DevicePreset | null {
  return (
    DEVICE_PRESETS.find(
      (preset) => preset.width === shape.w && preset.height === shape.h
    ) || null
  );
}

/**
 * Get device preset by ID
 */
export function getDevicePresetById(
  id: DevicePreset["id"]
): DevicePreset | undefined {
  return DEVICE_PRESETS.find((preset) => preset.id === id);
}
