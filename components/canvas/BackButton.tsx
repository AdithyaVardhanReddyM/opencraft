"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function BackButton() {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push("/dashboard");
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          disabled={isNavigating}
          className="h-10 w-10 text-muted-foreground hover:text-foreground bg-card/90 backdrop-blur-2xl saturate-150 border border-border hover:bg-card hover:border-border/80 transition-all duration-200"
          style={{
            boxShadow: "0 4px 16px -4px oklch(0 0 0 / 0.4)",
          }}
        >
          {isNavigating ? (
            <Loader2 className="size-4.5 animate-spin" />
          ) : (
            <ArrowLeft className="size-4.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        Back to Dashboard
      </TooltipContent>
    </Tooltip>
  );
}
