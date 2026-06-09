"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export type SandboxStatus =
  | "idle"
  | "checking"
  | "resuming"
  | "ready"
  | "expired"
  | "error";

interface UseSandboxResumeOptions {
  sandboxId?: string;
  sandboxUrl?: string;
  /** Auto-resume when sandboxId is provided */
  autoResume?: boolean;
}

interface UseSandboxResumeReturn {
  status: SandboxStatus;
  error: string | null;
  /** The current sandbox URL (may be updated after resume) */
  currentUrl: string | null;
  /** Manually trigger a resume */
  resume: () => Promise<void>;
  /** Reset state */
  reset: () => void;
}

export function useSandboxResume({
  sandboxId,
  sandboxUrl,
  autoResume = true,
}: UseSandboxResumeOptions): UseSandboxResumeReturn {
  const [status, setStatus] = useState<SandboxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(
    sandboxUrl || null
  );

  // Track if we've already attempted resume for this sandboxId
  const attemptedRef = useRef<string | null>(null);

  const resume = useCallback(async () => {
    if (!sandboxId) {
      setStatus("idle");
      return;
    }

    setStatus("resuming");
    setError(null);

    try {
      const response = await fetch("/api/sandbox/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.expired) {
          setStatus("expired");
          setError("Sandbox session has expired");
        } else {
          setStatus("error");
          setError(data.error || "Failed to resume sandbox");
        }
        return;
      }

      setCurrentUrl(data.sandboxUrl);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to resume sandbox");
    }
  }, [sandboxId]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setCurrentUrl(sandboxUrl || null);
    attemptedRef.current = null;
  }, [sandboxUrl]);

  // Auto-resume when sandboxId changes
  useEffect(() => {
    if (!autoResume) return;

    // If no sandboxId, reset to idle
    if (!sandboxId) {
      setStatus("idle");
      setCurrentUrl(null);
      return;
    }

    // If we already have a sandboxUrl and haven't changed sandboxId, assume ready
    if (sandboxUrl && attemptedRef.current === sandboxId) {
      return;
    }

    // Skip if we've already attempted for this sandboxId
    if (attemptedRef.current === sandboxId) {
      return;
    }

    attemptedRef.current = sandboxId;
    resume();
  }, [sandboxId, sandboxUrl, autoResume, resume]);

  // Update currentUrl when sandboxUrl prop changes
  useEffect(() => {
    if (sandboxUrl && status === "ready") {
      setCurrentUrl(sandboxUrl);
    }
  }, [sandboxUrl, status]);

  return {
    status,
    error,
    currentUrl,
    resume,
    reset,
  };
}
