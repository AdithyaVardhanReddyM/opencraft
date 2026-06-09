"use client";

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
import { AlertTriangle } from "lucide-react";

interface DeleteScreenModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  screenTitle?: string;
  isDeleting?: boolean;
}

export function DeleteScreenModal({
  isOpen,
  onConfirm,
  onCancel,
  screenTitle,
  isDeleting = false,
}: DeleteScreenModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Delete Screen?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {screenTitle || "this screen"}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
          <div className="mt-3 text-sm text-muted-foreground">
            <p>This will permanently delete:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>The screen and its preview</li>
              <li>All chat messages in this thread</li>
              <li>Any generated files and sandbox data</li>
            </ul>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Screen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
