"use client";

import type { ScreenShape } from "@/types/canvas";
import { Sparkles, Globe } from "lucide-react";

interface ScreenProps {
  shape: ScreenShape;
  isSelected: boolean;
  screenData?: {
    sandboxUrl?: string;
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
  const sandboxUrl = screenData?.sandboxUrl;
  const title = screenData?.title || "Untitled Screen";

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
              <Globe className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {sandboxUrl ? new URL(sandboxUrl).hostname : title}
              </span>
            </div>
          </div>

          {/* Spacer for symmetry */}
          <div className="w-[52px]" />
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-zinc-950 overflow-hidden">
          {sandboxUrl ? (
            <iframe
              src={sandboxUrl}
              className="w-full h-full border-0"
              title={title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <EmptyState />
          )}
        </div>
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
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 backdrop-blur-sm">
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
