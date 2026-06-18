"use client";

import { useState, useMemo, useOptimistic, useTransition } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { sortProjects, ProjectSortOption } from "@/lib/project-utils";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Button } from "@/components/ui/button";
import { AlertCircle, SearchX } from "lucide-react";
import { Project } from "@/types/project";
import { Id } from "@/convex/_generated/dataModel";
import { NewProjectCard } from "./NewProjectCard";

interface ProjectsGridProps {
  sortOption: ProjectSortOption;
  searchQuery: string;
  onCreateProject: () => void;
}

type OptimisticAction =
  | { type: "delete"; projectId: Id<"projects"> }
  | { type: "create"; project: Project };

export function ProjectsGrid({
  sortOption,
  searchQuery,
  onCreateProject,
}: ProjectsGridProps) {
  // Track projects being deleted for fade-out animation
  const [deletingProjects, setDeletingProjects] = useState<Set<Id<"projects">>>(
    new Set()
  );

  // Transition for optimistic updates
  const [, startTransition] = useTransition();

  // Wait for Convex to finish authenticating before querying. Right after
  // sign-in/sign-up the Clerk session exists but its token hasn't reached
  // Convex yet; querying during that window throws "Not authenticated".
  const { isAuthenticated } = useConvexAuth();

  // Fetch all projects for the authenticated user
  const projects = useQuery(
    api.projects.getAllProjects,
    isAuthenticated ? {} : "skip"
  );

  // Optimistic state for immediate UI updates
  const [optimisticProjects, setOptimisticProjects] = useOptimistic<
    Project[] | undefined,
    OptimisticAction
  >(projects, (state, action) => {
    if (!state) return state;

    if (action.type === "delete") {
      return state.filter((p) => p._id !== action.projectId);
    } else if (action.type === "create") {
      return [...state, action.project];
    }
    return state;
  });

  // Handle optimistic delete with fade-out animation
  const handleOptimisticDelete = (projectId: Id<"projects">) => {
    // Add to deleting set for fade-out animation
    setDeletingProjects((prev) => new Set(prev).add(projectId));

    // Wait for animation before optimistic update
    setTimeout(() => {
      startTransition(() => {
        setOptimisticProjects({ type: "delete", projectId });
        setDeletingProjects((prev) => {
          const next = new Set(prev);
          next.delete(projectId);
          return next;
        });
      });
    }, 300);
  };

  // Memoize filtered and sorted projects
  const filteredAndSortedProjects = useMemo(() => {
    if (!optimisticProjects) return [];

    // Filter by search query
    let filtered = optimisticProjects;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = optimisticProjects.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query)
      );
    }

    // Sort projects
    return sortProjects(filtered, sortOption);
  }, [optimisticProjects, sortOption, searchQuery]);

  // Handle loading state
  if (projects === undefined) {
    return <LoadingSkeleton />;
  }

  // Handle error state (Convex will throw errors that we can catch)
  if (projects === null) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="flex flex-col items-center text-center max-w-md space-y-4">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertCircle className="size-16 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold">Failed to load projects</h2>
          <p className="text-muted-foreground">
            There was an error loading your projects. Please try again.
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Handle empty state
  if (projects.length === 0) {
    return <EmptyState onCreateProject={onCreateProject} />;
  }

  // Handle no search results
  if (filteredAndSortedProjects.length === 0 && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-white px-6 py-20 text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-primary/10 ring-1 ring-border/60">
          <SearchX className="size-6 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          No matching projects
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Nothing matched{" "}
          <span className="font-medium text-foreground">
            &ldquo;{searchQuery}&rdquo;
          </span>
          . Try a different search.
        </p>
      </div>
    );
  }

  // Render project cards in responsive grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* New Project Card */}
      <NewProjectCard onClick={onCreateProject} />

      {/* Project Cards */}
      {filteredAndSortedProjects.map((project) => (
        <ProjectCard
          key={project._id}
          project={project}
          isDeleting={deletingProjects.has(project._id)}
          onOptimisticDelete={handleOptimisticDelete}
        />
      ))}
    </div>
  );
}
