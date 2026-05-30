"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* New Project Card Skeleton */}
      <Card className="overflow-hidden border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] p-6">
          <Skeleton className="size-24 rounded-full mb-4" />
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>

      {/* Project Card Skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-0">
            {/* Thumbnail skeleton with 16:9 aspect ratio */}
            <Skeleton className="w-full aspect-video rounded-b-none" />

            {/* Content skeleton */}
            <div className="p-5 space-y-3">
              {/* Badge skeleton */}
              <Skeleton className="h-5 w-20" />

              {/* Title and description */}
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>

              {/* Footer metadata */}
              <div className="pt-2 border-t border-border/50">
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
