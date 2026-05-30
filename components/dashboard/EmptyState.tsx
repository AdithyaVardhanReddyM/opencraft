"use client";

import { Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreateProject: () => void;
}

export function EmptyState({ onCreateProject }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 border-2 border-dashed rounded">
      <div className="flex flex-col items-center text-center max-w-lg space-y-6">
        {/* Icon with gradient background */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative rounded-full bg-card border-2 border-primary/20 p-4">
            <Layers className="size-10 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">No projects found</h2>
          <p className="text-muted-foreground">
            It looks quiet here. Start your journey by creating a new project to
            track your progress.
          </p>
        </div>

        {/* CTA Button */}
        <Button onClick={onCreateProject} size="lg" className="mt-4">
          <Plus className="size-5" />
          Create First Project
        </Button>
      </div>
    </div>
  );
}
