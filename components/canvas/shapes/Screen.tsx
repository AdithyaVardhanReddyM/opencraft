"use client";

import { useRef, useEffect, useCallback } from "react";
import type { ScreenShape } from "@/types/canvas";
import { Component, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import {
  useSandboxResume,
  type SandboxStatus,
} from "@/hooks/use-sandbox-resume";

interface ScreenProps {
  shape: ScreenShape;
  isSelected: boolean;
  /** True while the AI agent is actively generating code for this screen. */
  isGenerating?: boolean;
  screenData?: {
    sandboxUrl?: string;
    sandboxId?: string;
    title?: string;
  };
  onClick?: () => void;
}

// Screen shapes are placed at half of their real device size, so render the
// iframe at full device resolution and scale it down to fit — the page lays out
// at its true viewport width and reads realistically instead of zoomed-in.
const IFRAME_SCALE = 0.5;

export function Screen({
  shape,
  isSelected,
  isGenerating = false,
  screenData,
  onClick,
}: ScreenProps) {
  const { x, y, w, h } = shape;
  const title = screenData?.title || "Untitled Screen";
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Refresh iframe handler
  const refreshIframe = useCallback(() => {
    if (iframeRef.current) {
      // Reload iframe by resetting src
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = "";
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 50);
    }
  }, []);

  // Listen for refresh events from toolbar
  useEffect(() => {
    const handleRefresh = (e: Event) => {
      const customEvent = e as CustomEvent<{ shapeId: string }>;
      if (customEvent.detail.shapeId === shape.id) {
        refreshIframe();
      }
    };

    window.addEventListener("screen-refresh", handleRefresh);
    return () => window.removeEventListener("screen-refresh", handleRefresh);
  }, [shape.id, refreshIframe]);

  // Use the sandbox resume hook to handle paused sandboxes
  const { status, error, currentUrl, resume } = useSandboxResume({
    sandboxId: screenData?.sandboxId,
    sandboxUrl: screenData?.sandboxUrl,
    autoResume: true,
  });

  // Determine what to show in the content area
  const showIframe = status === "ready" && currentUrl;
  const showLoading = status === "resuming" || status === "checking";
  const showError = status === "error" || status === "expired";
  const showEmpty = status === "idle" && !screenData?.sandboxId;

  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
      }}
      onClick={onClick}
    >
      {/* Soft outward bloom while generating — sits on the non-clipping wrapper
          so the glow can extend past the screen edge. */}
      {isGenerating && <div className="screen-beam-glow" aria-hidden />}

      {/* Screen surface — a clean floating artboard, no browser chrome */}
      <div
        className="relative h-full w-full overflow-hidden bg-white"
        style={{
          // No blue ring here when selected — the canvas BoundingBox already
          // draws the selection outline, so adding one produced a doubled line.
          // Keep just the elevation shadow and a subtle hairline edge.
          boxShadow: isSelected
            ? "0 20px 48px -16px rgba(15, 23, 42, 0.30), 0 0 0 1px rgba(15, 23, 42, 0.06)"
            : "0 1px 2px rgba(15, 23, 42, 0.04), 0 16px 40px -16px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.06)",
        }}
      >
        {showIframe && (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="absolute left-0 top-0 border-0"
            style={{
              width: w / IFRAME_SCALE,
              height: h / IFRAME_SCALE,
              transform: `scale(${IFRAME_SCALE})`,
              transformOrigin: "top left",
              pointerEvents: isSelected ? "auto" : "none",
            }}
            title={title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            data-sandbox-preview="true"
            data-sandbox-id={screenData?.sandboxId}
          />
        )}

        {showLoading && <LoadingState status={status} />}

        {showError && (
          <ErrorState error={error} onRetry={resume} status={status} />
        )}

        {showEmpty && <EmptyState />}

        {/* Click Overlay - captures clicks when screen is not selected */}
        <div
          className="absolute inset-0"
          style={{
            pointerEvents: isSelected ? "none" : "auto",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        />

        {/* Animated border beam while the agent is generating for this screen */}
        {isGenerating && <div className="screen-beam" aria-hidden />}
      </div>
    </div>
  );
}

/**
 * Shared backdrop: a calm dot grid with a faint single-accent wash from the top.
 * No multi-color gradients — quiet, tool-like depth.
 */
function Backdrop() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15, 23, 42, 0.045) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 50% -15%, oklch(0.5665 0.1947 256.1696 / 0.06) 0%, transparent 55%)`,
        }}
      />
    </>
  );
}

/** Empty state — shown when a freshly placed screen has no content yet. */
function EmptyState() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white p-6">
      <Backdrop />
      <div className="relative z-10 flex flex-col items-center text-center">
        <Component className="mb-3 h-8 w-8 text-primary" strokeWidth={1.75} />
        <p className="text-sm font-semibold tracking-tight text-zinc-900">
          Start building
        </p>
        <p className="mt-1 text-xs text-zinc-500">Click to open the chat</p>
      </div>
    </div>
  );
}

/** Loading state while the sandbox is resuming. */
function LoadingState({ status }: { status: SandboxStatus }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white p-6">
      <Backdrop />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <p className="text-sm font-semibold tracking-tight text-zinc-900">
          {status === "checking" ? "Checking sandbox" : "Resuming sandbox"}
        </p>
        <p className="mt-1 text-xs text-zinc-500">This only takes a moment</p>
      </div>
    </div>
  );
}

/** Error state when the sandbox fails to resume. */
function ErrorState({
  error,
  onRetry,
  status,
}: {
  error: string | null;
  onRetry: () => void;
  status: SandboxStatus;
}) {
  const isExpired = status === "expired";

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white p-6">
      <Backdrop />
      <div className="relative z-10 flex max-w-[260px] flex-col items-center text-center">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-500" />
        </div>
        <p className="text-sm font-semibold tracking-tight text-zinc-900">
          {isExpired ? "Sandbox expired" : "Failed to load"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          {isExpired
            ? "This session expired. Send a new message to start fresh."
            : error || "Something went wrong while loading."}
        </p>

        {!isExpired && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
