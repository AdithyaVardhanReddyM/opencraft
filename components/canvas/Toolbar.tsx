"use client";

import {
  MousePointer2,
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
}

const TOOLS: ToolConfig[] = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "frame", icon: Hash, label: "Frame" },
  { id: "rect", icon: Square, label: "Rectangle" },
  { id: "ellipse", icon: Circle, label: "Ellipse" },
  { id: "line", icon: Minus, label: "Line" },
  { id: "arrow", icon: ArrowRight, label: "Arrow" },
  { id: "freedraw", icon: Pencil, label: "Pencil" },
  { id: "text", icon: Type, label: "Text" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
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
              className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
