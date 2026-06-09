"use client";

import { useRef, useEffect, useCallback } from "react";
import type { ScreenShape } from "@/types/canvas";
import { Sparkles, Globe, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import {
  useSandboxResume,
  type SandboxStatus,
} from "@/hooks/use-sandbox-resume";

interface ScreenProps {
  shape: ScreenShape;
  isSelected: boolean;
  screenData?: {
    sandboxUrl?: string;
    sandboxId?: string;
    title?: string;
  };
  onClick?: () => void;
}

// Browser chrome title bar height
const TITLE_BAR_HEIGHT = 36;

export function Screen({
  shape,
  isSelected,
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
      {/* Browser Chrome Container */}
      <div
        className="w-full h-full rounded-lg overflow-hidden flex flex-col"
        style={{
          boxShadow: isSelected
            ? "0 0 0 2px hsl(24 95% 53%), 0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            : "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Title Bar */}
        <div
          className="flex items-center gap-3 px-4 bg-zinc-900 border-b border-zinc-800 shrink-0"
          style={{ height: TITLE_BAR_HEIGHT }}
        >
          {/* Traffic Light Buttons */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
          </div>

          {/* URL Bar / Title */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-800/60 text-zinc-400 text-xs max-w-md truncate">
              {showLoading ? (
                <Loader2 className="w-3 h-3 shrink-0 animate-spin" />
              ) : (
                <Globe className="w-3 h-3 shrink-0" />
              )}
              <span className="truncate">
                {showLoading
                  ? "Resuming sandbox..."
                  : currentUrl
                  ? new URL(currentUrl).hostname
                  : title}
              </span>
            </div>
          </div>

          {/* Spacer for symmetry */}
          <div className="w-[52px]" />
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-zinc-950 overflow-hidden">
          {showIframe && (
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border-0"
              style={{
                pointerEvents: isSelected ? "auto" : "none",
              }}
              title={title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
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
        </div>
      </div>
    </div>
  );
}

/**
 * Loading state while sandbox is resuming
 */
function LoadingState({ status }: { status: SandboxStatus }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Gradient Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), " +
            "radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 40%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Spinner */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
          <div className="absolute -inset-4 bg-blue-500/10 rounded-3xl blur-2xl -z-10" />
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-white mb-2">
          {status === "checking"
            ? "Checking sandbox..."
            : "Resuming sandbox..."}
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Your sandbox is waking up. This usually takes a few seconds.
        </p>
      </div>
    </div>
  );
}

/**
 * Error state when sandbox fails to resume
 */
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
    <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Gradient Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(239, 68, 68, 0.15) 0%, transparent 50%), " +
            "radial-gradient(ellipse at 80% 80%, rgba(251, 146, 60, 0.1) 0%, transparent 40%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-white/10 backdrop-blur-sm">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <div className="absolute -inset-4 bg-red-500/10 rounded-3xl blur-2xl -z-10" />
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-white mb-2">
          {isExpired ? "Sandbox expired" : "Failed to load"}
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          {isExpired
            ? "This sandbox session has expired. Send a new message to create a fresh environment."
            : error || "Something went wrong while loading the sandbox."}
        </p>

        {/* Retry Button */}
        {!isExpired && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-sm text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state placeholder when no sandbox URL is set
 */
function EmptyState() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Gradient Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(251, 146, 60, 0.15) 0%, transparent 50%), " +
            "radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 40%), " +
            "radial-gradient(ellipse at 20% 60%, rgba(59, 130, 246, 0.1) 0%, transparent 40%)",
        }}
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), " +
            "linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 backdrop-blur-sm">
            <Sparkles className="w-10 h-10 text-orange-400" />
          </div>
          <div className="absolute -inset-4 bg-orange-500/10 rounded-3xl blur-2xl -z-10" />
        </div>

        {/* Text */}
        <h3 className="text-xl font-semibold text-white mb-2">
          Create something beautiful
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          Describe what you want to build and watch AI bring your ideas to life.
          Landing pages, dashboards, components — anything you can imagine.
        </p>

        {/* Hint */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-500">
          <span>Click to open chat</span>
          <span className="text-orange-400">→</span>
        </div>
      </div>
    </div>
  );
}
