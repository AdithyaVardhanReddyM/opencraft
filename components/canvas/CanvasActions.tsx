"use client";

import { useState } from "react";
import { Globe, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RemixFromWebModal } from "./RemixFromWebModal";
import { ShareCanvasModal } from "./ShareCanvasModal";

export function CanvasActions() {
  const [isRemixModalOpen, setIsRemixModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsRemixModalOpen(true)}
        className="gap-2 px-3 h-9 text-muted-foreground hover:text-foreground bg-card/90 backdrop-blur-2xl saturate-150 hover:bg-card transition-all duration-200"
        style={{
          boxShadow: "0 4px 16px -4px oklch(0 0 0 / 0.4)",
        }}
      >
        <Globe className="size-4" />
        <span className="font-medium">Remix from Web</span>
      </Button>

      <RemixFromWebModal
        open={isRemixModalOpen}
        onOpenChange={setIsRemixModalOpen}
      />

      <Button
        variant="default"
        size="sm"
        onClick={() => setIsShareModalOpen(true)}
        className="gap-2 px-4 h-9 bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-all duration-200"
        style={{
          boxShadow:
            "0 4px 16px -4px oklch(0.7114 0.1728 56.6323 / 0.5), 0 2px 8px -2px oklch(0 0 0 / 0.3)",
        }}
      >
        <Share2 className="size-4" />
        <span className="font-medium">Share</span>
      </Button>

      <ShareCanvasModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
      />
    </div>
  );
}
