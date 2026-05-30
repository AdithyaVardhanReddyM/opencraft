"use client";

import { useState } from "react";
import Image from "next/image";
import { Layers, Trash2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/date-utils";
import { Project } from "@/types/project";
import { DeleteProjectDialog } from "@/components/dashboard/DeleteProjectDialog";
import { Id } from "@/convex/_generated/dataModel";

interface ProjectCardProps {
  project: Project;
  isDeleting?: boolean;
  onOptimisticDelete?: (projectId: Id<"projects">) => void;
}

// Gradient options for project cards
const gradients = [
  "from-violet-500/20 via-purple-500/20 to-fuchsia-500/20",
  "from-blue-500/20 via-cyan-500/20 to-teal-500/20",
  "from-orange-500/20 via-red-500/20 to-pink-500/20",
  "from-green-500/20 via-emerald-500/20 to-teal-500/20",
  "from-yellow-500/20 via-orange-500/20 to-red-500/20",
  "from-indigo-500/20 via-purple-500/20 to-pink-500/20",
];

export function ProjectCard({
  project,
  isDeleting = false,
  onOptimisticDelete,
}: ProjectCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Select gradient based on project ID for consistency
  const gradientIndex = project.projectNumber % gradients.length;
  const gradient = gradients[gradientIndex];

  const handleCardClick = () => {
    // Placeholder for navigation - will be implemented in future tasks
    console.log("Navigate to project:", project._id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Card
        className={`overflow-hidden py-0 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg group relative ${
          isDeleting ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Delete Button - Subtle, appears on hover */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 z-10 size-8 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleDeleteClick}
          aria-label="Delete project"
        >
          <Trash2 className="size-4" />
        </Button>

        {/* Gradient Thumbnail with Icon */}
        <div className="relative aspect-video overflow-hidden">
          {project.thumbnail ? (
            <Image
              src={project.thumbnail}
              alt={project.name}
              fill
              className="object-cover"
            />
          ) : (
            <div
              className={`w-full h-full bg-linear-to-br ${gradient} flex items-center justify-center`}
            >
              <Layers className="size-10 text-foreground/30" />
            </div>
          )}
          {/* Fade overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-card via-card/50 to-transparent pointer-events-none" />
        </div>

        {/* Project Details */}
        <div className="px-4 relative z-10">
          {/* Project Title */}
          <h3 className="font-semibold text-base leading-tight line-clamp-1 mb-1">
            {project.name}
          </h3>

          {/* Project Description */}
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Metadata Footer */}
          <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-1 pb-4">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>Created {formatRelativeTime(project.createdAt)}</span>
            </div>
            {project.lastModified !== project.createdAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                <span>Modified {formatRelativeTime(project.lastModified)}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteProjectDialog
        project={project}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onOptimisticDelete={onOptimisticDelete}
      />
    </>
  );
}
