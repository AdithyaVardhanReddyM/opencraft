"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2, Clock, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/date-utils";
import { generateGradientThumbnail } from "@/lib/gradient-utils";
import { Project } from "@/types/project";
import { DeleteProjectDialog } from "@/components/dashboard/DeleteProjectDialog";
import { Id } from "@/convex/_generated/dataModel";

interface ProjectCardProps {
  project: Project;
  isDeleting?: boolean;
  onOptimisticDelete?: (projectId: Id<"projects">) => void;
}

export function ProjectCard({
  project,
  isDeleting = false,
  onOptimisticDelete,
}: ProjectCardProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const gradientThumbnail = useMemo(() => {
    return generateGradientThumbnail(project.projectNumber);
  }, [project.projectNumber]);

  const handleCardClick = () => {
    router.push(`/dashboard/${project._id}/canvas`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const isNewProject = project.lastModified === project.createdAt;

  return (
    <>
      <Card
        className={`overflow-hidden p-0 cursor-pointer transition-all duration-200 border-0 hover:border-0 group relative bg-card ${
          isDeleting ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        style={{
          boxShadow: isHovered
            ? "0 10px 36px -4px oklch(0.7114 0.1728 56.6323 / 1), 0 12px 24px -8px oklch(0 0 0 / 0.4)"
            : undefined,
        }}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-3 right-3 z-10 size-8 bg-background/90 backdrop-blur-sm border border-border/50 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleDeleteClick}
          aria-label="Delete project"
        >
          <Trash2 className="size-3.5" />
        </Button>

        {/* Thumbnail */}
        <div className="relative aspect-16/10 overflow-hidden bg-muted">
          {project.thumbnail ? (
            <Image
              src={project.thumbnail}
              alt={project.name}
              fill
              className="object-cover"
            />
          ) : (
            <>
              <Image
                src={gradientThumbnail}
                alt={project.name}
                fill
                className="object-cover"
              />
              {/* Logo overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/unitset_logo.svg"
                  alt="Unit Set"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
            </>
          )}
        </div>

        {/* Project Details */}
        <div className="px-3  pb-2.5 space-y-1.5">
          {/* Title Row */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-sm leading-tight line-clamp-1 text-foreground">
              {project.name}
            </h2>
            {isNewProject && (
              <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                <Sparkles className="size-2.5" />
                New
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
            {project.description || "No description"}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="size-3" />
              <span>Created {formatRelativeTime(project.createdAt)}</span>
            </div>
            {!isNewProject && (
              <span className="text-[11px] text-muted-foreground/70">
                Edited {formatRelativeTime(project.lastModified)}
              </span>
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
