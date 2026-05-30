"use client";

import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface NewProjectCardProps {
  onClick: () => void;
}

export function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-primary/20 hover:shadow-lg border-2 border-dashed border-border group"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] p-6">
        <div className="rounded-full bg-muted group-hover:bg-primary/10 p-4 transition-colors duration-300 mb-4">
          <Plus className="size-8 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
        </div>
        <h3 className="text-lg font-semibold mb-2">New Project</h3>
        <p className="text-sm text-muted-foreground text-center">
          Create a new project dashboard to track your progress
        </p>
      </CardContent>
    </Card>
  );
}
