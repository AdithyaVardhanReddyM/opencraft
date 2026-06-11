"use client";

import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Pencil,
  Type,
  Eraser,
  ArrowRight,
  Minus,
  Frame,
  Monitor,
} from "lucide-react";
import type { Tool } from "@/types/canvas";
import type { LucideIcon } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";

interface ToolbarProps {
  currentTool: Tool;
  onToolSelect: (tool: Tool) => void;
}

interface ToolConfig {
  id: Tool;
  icon: LucideIcon;
  label: string;
  shortcut: string;
  special?: boolean;
}

const TOOLS: ToolConfig[] = [
  { id: "select", icon: MousePointer2, label: "Select", shortcut: "S" },
  { id: "hand", icon: Hand, label: "Hand", shortcut: "H" },
  { id: "frame", icon: Frame, label: "Frame", shortcut: "F" },
  { id: "rect", icon: Square, label: "Rectangle", shortcut: "R" },
  { id: "ellipse", icon: Circle, label: "Ellipse", shortcut: "C" },
  { id: "line", icon: Minus, label: "Line", shortcut: "L" },
  { id: "arrow", icon: ArrowRight, label: "Arrow", shortcut: "A" },
  { id: "freedraw", icon: Pencil, label: "Draw", shortcut: "D" },
  { id: "text", icon: Type, label: "Text", shortcut: "T" },
  { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
];

const SCREEN_TOOL: ToolConfig = {
  id: "screen",
  icon: Monitor,
  label: "AI Screen",
  shortcut: "W",
  special: true,
};

export function Toolbar({ currentTool, onToolSelect }: ToolbarProps) {
  const isScreenActive = currentTool === "screen";

  return (
    <div className="pointer-events-auto fixed left-1/2 top-0 z-50 -translate-x-1/2 flex flex-col items-center">
      {/* Notch container */}
      <div
        className="relative flex items-center gap-1 bg-card px-3 pt-3 pb-3 backdrop-blur-2xl saturate-150"
        style={{
          borderRadius: "0 0 16px 16px",
          boxShadow:
            "0 8px 32px -4px oklch(0.7114 0.1728 56.6323 / 0.25), 0 12px 24px -8px oklch(0 0 0 / 0.4)",
        }}
      >
        {/* Regular tools */}
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = currentTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              aria-label={tool.label}
              aria-pressed={isActive}
              title={`${tool.label} (${tool.shortcut})`}
              className={`relative flex h-9 w-9 items-center justify-center rounded-md transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span
                className={`pointer-events-none absolute bottom-0.5 right-0.5 text-[10px] font-semibold ${
                  isActive ? "text-primary-foreground/80" : "text-foreground/70"
                }`}
              >
                {tool.shortcut}
              </span>
            </button>
          );
        })}

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-border/50" />

        {/* AI Screen button - special styling */}
        <button
          onClick={() => onToolSelect(SCREEN_TOOL.id)}
          aria-label={SCREEN_TOOL.label}
          aria-pressed={isScreenActive}
          title={`${SCREEN_TOOL.label} (${SCREEN_TOOL.shortcut})`}
          className={`group relative flex h-9 items-center gap-1.5 rounded-lg px-2.5 transition-all duration-300 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 ${
            isScreenActive
              ? "bg-linear-to-r from-primary to-orange-400 text-white shadow-lg shadow-primary/30"
              : "bg-linear-to-r from-primary/15 to-orange-400/15 text-primary hover:from-primary/25 hover:to-orange-400/25 hover:shadow-md hover:shadow-primary/20"
          }`}
        >
          {/* Animated glow ring when not active */}
          {!isScreenActive && (
            <span className="absolute inset-0 rounded-lg bg-linear-to-r from-primary/40 to-orange-400/40 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100" />
          )}

          {/* Monitor icon with animation */}
          <Monitor
            className={`relative h-4 w-4 transition-transform duration-300 ${
              isScreenActive ? "text-white" : "text-primary"
            } ${!isScreenActive ? "group-hover:scale-110" : ""}`}
          />

          {/* Label */}
          <span
            className={`relative text-xs font-medium ${
              isScreenActive ? "text-white" : "text-primary"
            }`}
          >
            AI
          </span>

          {/* Shortcut badge */}
          <span
            className={`relative ml-0.5 rounded px-1 py-0.5 text-[9px] font-semibold ${
              isScreenActive
                ? "bg-white/20 text-white"
                : "bg-primary/10 text-primary/80"
            }`}
          >
            {SCREEN_TOOL.shortcut}
          </span>

          {/* Subtle shimmer effect on hover */}
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
            <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </span>
        </button>
      </div>
      {/* Helper text below notch */}
      <p className="mt-2 text-[10px] text-muted-foreground/70">
        Glide with <Kbd className="bg-white/8">Scroll</Kbd>, hold{" "}
        <Kbd className="bg-white/8">Space</Kbd>, or use hand tool
      </p>
    </div>
  );
}
