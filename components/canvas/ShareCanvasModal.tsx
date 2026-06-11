"use client";

import { useState } from "react";
import { Mail, Send, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ShareCanvasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareCanvasModal({
  open,
  onOpenChange,
}: ShareCanvasModalProps) {
  const [email, setEmail] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    if (!email.trim() || !email.includes("@")) return;

    setIsInviting(true);
    // Fake delay for UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    setInvitedEmails((prev) => [...prev, email.trim()]);
    setEmail("");
    setIsInviting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInvite();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-primary">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Share Canvas with Team
          </DialogTitle>
          <DialogDescription>
            Invite team members to collaborate on this canvas via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 focus-visible:ring-transparent border-0"
              />
            </div>
            <Button
              variant="ghost"
              onClick={handleInvite}
              disabled={!email.trim() || !email.includes("@") || isInviting}
              className="gap-2"
            >
              {isInviting ? (
                <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Invite
            </Button>
          </div>

          {invitedEmails.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Invitations Sent
              </p>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {invitedEmails.map((invitedEmail, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2"
                  >
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span className="truncate">{invitedEmail}</span>
                    <span className="ml-auto text-xs text-muted-foreground/70">
                      Invite sent
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
