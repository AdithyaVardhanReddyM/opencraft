"use client";

import {
  Search,
  RotateCcw,
  Clock,
  Calendar,
  ArrowDownAZ,
  ArrowUpAZ,
  History,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProjectSortOption } from "@/types/project";

interface ProjectFiltersProps {
  sortBy: ProjectSortOption;
  onSortChange: (sort: ProjectSortOption) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ProjectFilters({
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
}: ProjectFiltersProps) {
  const hasFilters = searchQuery || sortBy !== "newest";

  const handleReset = () => {
    onSearchChange("");
    onSortChange("newest");
  };

  const sortOptions: {
    value: ProjectSortOption;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "newest",
      label: "Newest Created",
      icon: <Clock className="size-4" />,
    },
    {
      value: "oldest",
      label: "Oldest Created",
      icon: <Calendar className="size-4" />,
    },
    {
      value: "modified",
      label: "Last Modified",
      icon: <History className="size-4" />,
    },
    {
      value: "name-asc",
      label: "Name (A-Z)",
      icon: <ArrowDownAZ className="size-4" />,
    },
    {
      value: "name-desc",
      label: "Name (Z-A)",
      icon: <ArrowUpAZ className="size-4" />,
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground mt-1">
          Manage your ongoing work, track progress, and collaborate.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:min-w-[400px]">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 pl-9 transition-all duration-300 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(var(--primary),0.1)] hover:border-primary/50"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50">
          <TooltipProvider delayDuration={0}>
            {sortOptions.map((option) => (
              <Tooltip key={option.value}>
                <TooltipTrigger asChild>
                  <Button
                    variant={sortBy === option.value ? "secondary" : "ghost"}
                    size="icon"
                    className={`size-8 ${
                      sortBy === option.value
                        ? "bg-background shadow-sm text-primary hover:bg-background hover:text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => onSortChange(option.value)}
                  >
                    {option.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{option.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>

          {hasFilters && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={handleReset}
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset filters</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
