"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  PanelRight,
  Search,
  X,
  Layers,
  GripVertical,
  MousePointer2,
} from "lucide-react";
import type { Shape, SelectionMap } from "@/types/canvas";
import { getShapeIcon, getShapeName } from "@/lib/canvas/layers-sidebar-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface LayersSidebarProps {
  shapes: Shape[];
  selectedShapes: SelectionMap;
  onShapeClick: (shapeId: string) => void;
  onReorderShape?: (shapeId: string, newIndex: number) => void;
  isOpen: boolean;
}

interface ShapeItemProps {
  shape: Shape;
  isSelected: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragging: boolean;
  isDragOver: boolean;
}

function ShapeItem({
  shape,
  isSelected,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
}: ShapeItemProps) {
  const Icon = getShapeIcon(shape.type);
  const name = getShapeName(shape);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "group flex w-full items-center gap-1 rounded-md text-sm transition-all duration-200 outline-none",
        isSelected
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        isDragging && "opacity-50",
        isDragOver &&
          "ring-2 ring-primary/40 ring-offset-1 ring-offset-background"
      )}
    >
      {/* Drag handle */}
      <div className="flex items-center justify-center w-6 h-8 cursor-grab active:cursor-grabbing shrink-0">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
      </div>

      {/* Clickable content */}
      <button
        onClick={onClick}
        className="flex items-center gap-2.5 flex-1 py-2 pr-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-r-md"
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isSelected
              ? "text-primary"
              : "text-muted-foreground/70 group-hover:text-foreground"
          )}
        />
        <span className="truncate flex-1 text-left">{name}</span>
        {isSelected && (
          <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 shadow-[0_0_4px_rgba(0,0,0,0.2)]" />
        )}
      </button>
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-full border-2 border-dashed border-primary/20 rounded-lg p-6 flex flex-col items-center justify-center">
        <div className="h-12 w-12 flex items-center justify-center ">
          <Layers
            className="h-6 w-6 text-primary"
            style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.6))" }}
          />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          {hasSearch ? "No results" : "No layers"}
        </p>
        <p className="text-[10px] text-muted-foreground max-w-[140px]">
          {hasSearch ? "Try a different term" : "Add shapes to canvas"}
        </p>
      </div>
    </div>
  );
}

function SearchBar({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative group">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70 group-focus-within:text-primary/70 transition-colors pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter layers..."
        className="w-full h-8 pl-8 pr-8 text-xs bg-muted/30 hover:bg-muted/50 focus:bg-background border border-transparent focus:border-primary/20 rounded-md placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function LayersSidebarToggle({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const isHoveringRef = useRef(false);

  return (
    <Tooltip
      delayDuration={300}
      open={tooltipOpen}
      onOpenChange={(open) => {
        if (open && !isHoveringRef.current) return;
        setTooltipOpen(open);
      }}
    >
      <TooltipTrigger asChild>
        <button
          onClick={onToggle}
          onMouseEnter={() => {
            isHoveringRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveringRef.current = false;
            setTooltipOpen(false);
          }}
          aria-label={isOpen ? "Close layers panel" : "Open layers panel"}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
            isOpen
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
              : "bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground shadow-sm"
          )}
        >
          <PanelRight className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4} className="text-xs">
        {isOpen ? "Close layers" : "Open layers"}
      </TooltipContent>
    </Tooltip>
  );
}

export function LayersSidebar({
  shapes,
  selectedShapes,
  onShapeClick,
  onReorderShape,
  isOpen,
}: LayersSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const filteredShapes = useMemo(() => {
    if (!searchQuery.trim()) return shapes;
    const query = searchQuery.toLowerCase();
    return shapes.filter((shape) => {
      const name = getShapeName(shape).toLowerCase();
      const type = shape.type.toLowerCase();
      return name.includes(query) || type.includes(query);
    });
  }, [shapes, searchQuery]);

  // Keep original order - bottom layer first in list, top layer last
  const displayShapes = filteredShapes;

  const handleDragStart = useCallback((e: React.DragEvent, shapeId: string) => {
    setDraggedId(shapeId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", shapeId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, shapeId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (shapeId !== draggedId) {
        setDragOverId(shapeId);
      }
    },
    [draggedId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetShapeId: string) => {
      e.preventDefault();
      if (!draggedId || draggedId === targetShapeId || !onReorderShape) return;

      // Find indices in the original (non-reversed) shapes array
      const draggedIndex = shapes.findIndex((s) => s.id === draggedId);
      const targetIndex = shapes.findIndex((s) => s.id === targetShapeId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Since display is reversed, dropping above in UI means moving to higher index
      // and dropping below means moving to lower index
      onReorderShape(draggedId, targetIndex);

      setDraggedId(null);
      setDragOverId(null);
    },
    [draggedId, shapes, onReorderShape]
  );

  if (!isOpen) return null;

  return (
    <div
      className="pointer-events-auto fixed right-3 z-40 flex flex-col"
      style={{
        top: "60px",
        bottom: "72px",
        width: "285px",
      }}
    >
      <div className="flex flex-col h-full rounded-xl bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative flex flex-col gap-3 p-3 bg-muted/5">
          <div className="absolute bottom-0 left-4 right-4 h-px bg-border/40" />
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Layers
              </h3>
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium text-muted-foreground">
                {shapes.length}
              </span>
            </div>
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery("")}
          />
        </div>

        {/* Content */}
        {displayShapes.length === 0 ? (
          <EmptyState hasSearch={searchQuery.length > 0} />
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {displayShapes.map((shape) => (
                <ShapeItem
                  key={shape.id}
                  shape={shape}
                  isSelected={!!selectedShapes[shape.id]}
                  onClick={() => onShapeClick(shape.id)}
                  onDragStart={(e) => handleDragStart(e, shape.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, shape.id)}
                  onDrop={(e) => handleDrop(e, shape.id)}
                  isDragging={draggedId === shape.id}
                  isDragOver={dragOverId === shape.id}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {shapes.length > 0 && (
          <div className="relative px-3 py-2 bg-muted/5">
            <div className="absolute top-0 left-4 right-4 h-px bg-border/40" />
            <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground/60">
              <div className="flex items-center gap-1">
                <GripVertical className="h-3 w-3" />
                <span>Drag to reorder</span>
              </div>
              <div className="flex items-center gap-1">
                <MousePointer2 className="h-3 w-3" />
                <span>Click to focus</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
