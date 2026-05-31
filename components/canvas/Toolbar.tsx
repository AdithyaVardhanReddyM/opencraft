"use client";

import {
  MousePointer2,
  Hand,
  Hash,
  Square,
  Circle,
  Pencil,
  Type,
  Eraser,
  ArrowRight,
  Minus,
} from "lucide-react";
import type { Tool } from "@/types/canvas";
import type { LucideIcon } from "lucide-react";

interface ToolbarProps {
  currentTool: Tool;
  onToolSelect: (tool: Tool) => void;
}

interface ToolConfig {
  id: Tool;
  icon: LucideIcon;
  label: string;
  shortcut: string;
}

const TOOLS: ToolConfig[] = [
  { id: "select", icon: MousePointer2, label: "Select", shortcut: "S" },
  { id: "hand", icon: Hand, label: "Hand", shortcut: "H" },
  { id: "frame", icon: Hash, label: "Frame", shortcut: "F" },
  { id: "rect", icon: Square, label: "Rectangle", shortcut: "R" },
  { id: "ellipse", icon: Circle, label: "Ellipse", shortcut: "C" },
  { id: "line", icon: Minus, label: "Line", shortcut: "L" },
  { id: "arrow", icon: ArrowRight, label: "Arrow", shortcut: "A" },
  { id: "freedraw", icon: Pencil, label: "Draw", shortcut: "D" },
  { id: "text", icon: Type, label: "Text", shortcut: "T" },
  { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
];

export function Toolbar({ currentTool, onToolSelect }: ToolbarProps) {
  return (
    <div className="pointer-events-auto fixed left-1/2 top-4 z-50 -translate-x-1/2">
      <div className="flex gap-1 rounded-lg border border-border bg-card/95 p-2 shadow-lg backdrop-blur-sm">
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
      </div>
    </div>
  );
}
