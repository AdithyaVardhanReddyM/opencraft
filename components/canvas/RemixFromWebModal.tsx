"use client";

import Image from "next/image";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RemixFromWebModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemixFromWebModal({
  open,
  onOpenChange,
}: RemixFromWebModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Remix from Web</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-full max-w-[320px] rounded-[12px] overflow-hidden  shadow-md">
            <Image
              src="/extension_card.svg"
              alt="UnitSet Chrome Extension"
              width={320}
              height={200}
              className="w-full h-auto"
              priority
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Remix from Web
            </h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Download our Chrome extension to remix or replicate components
              from websites directly into UnitSet.
            </p>
          </div>

          <Button className="gap-2">
            <Download className="size-4" />
            Download Extension
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
