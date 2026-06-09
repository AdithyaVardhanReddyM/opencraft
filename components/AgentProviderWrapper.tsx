"use client";

import { ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { AgentProvider } from "@inngest/use-agent";

interface AgentProviderWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides the AgentProvider context for streaming chat.
 * Uses the default transport which expects /api/chat and /api/realtime/token endpoints.
 */
export function AgentProviderWrapper({ children }: AgentProviderWrapperProps) {
  const { user, isLoaded } = useUser();

  // Use a stable userId - don't change it after initial load
  // This prevents WebSocket reconnection when auth state changes
  const userId = isLoaded ? user?.id || "anonymous" : "anonymous";

  return (
    <AgentProvider userId={userId} debug={false}>
      {children}
    </AgentProvider>
  );
}
