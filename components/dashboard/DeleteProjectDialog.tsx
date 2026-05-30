"use client";

import { useTransition, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/convex/_generated/api";
import { Project } from "@/types/project";
import { Id } from "@/convex/_generated/dataModel";

interface DeleteProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptimisticDelete?: (projectId: Id<"projects">) => void;
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onOptimisticDelete,
}: DeleteProjectDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const deleteProject = useMutation(api.projects.deleteProject);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        setError(null);

        // Close dialog immediately
        onOpenChange(false);

        // Trigger optimistic delete with fade-out animation
        if (onOptimisticDelete) {
          onOptimisticDelete(project._id);
        }

        // Perform actual deletion
        await deleteProject({ projectId: project._id });

        // Show success toast
        toast.success("Project deleted", {
          description: `"${project.name}" has been deleted successfully.`,
        });
      } catch (err) {
        // Handle error - show error toast
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete project";
        toast.error("Failed to delete project", {
          description: errorMessage,
        });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{project.name}&quot;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Inline error display */}
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
