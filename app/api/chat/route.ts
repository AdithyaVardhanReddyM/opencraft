import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { z } from "zod";

// Schema for @inngest/use-agent sendMessage format (wrapped in params)
const useAgentParamsSchema = z.object({
  params: z.object({
    userMessage: z.object({
      id: z.string(),
      content: z.string(),
      role: z.enum(["user"]),
      state: z.record(z.string(), z.unknown()).optional(),
    }),
    threadId: z.string(),
    history: z.array(z.unknown()),
    userId: z.string().optional(),
    channelKey: z.string().optional(),
  }),
});

// Schema for @inngest/use-agent sendMessage format (direct, no params wrapper)
const useAgentDirectSchema = z.object({
  userMessage: z.object({
    id: z.string(),
    content: z.string(),
    role: z.enum(["user"]),
    state: z.record(z.string(), z.unknown()).optional(),
  }),
  threadId: z.string(),
  history: z.array(z.unknown()),
  userId: z.string().optional(),
  channelKey: z.string().optional(),
});

// Legacy schema for direct API calls
const legacySchema = z.object({
  message: z.string().min(1),
  screenId: z.string(),
  projectId: z.string(),
  channelKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Try to parse as useAgent format with params wrapper
    const useAgentParamsResult = useAgentParamsSchema.safeParse(body);
    if (useAgentParamsResult.success) {
      const { params } = useAgentParamsResult.data;
      return handleUseAgentFormat(params, userId);
    }

    // Try to parse as useAgent format without params wrapper
    const useAgentDirectResult = useAgentDirectSchema.safeParse(body);
    if (useAgentDirectResult.success) {
      return handleUseAgentFormat(useAgentDirectResult.data, userId);
    }

    // Try legacy format
    const legacyResult = legacySchema.safeParse(body);
    if (legacyResult.success) {
      const { message, screenId, projectId, channelKey } = legacyResult.data;

      const { ids } = await inngest.send({
        name: "agent/chat.requested",
        data: {
          message,
          screenId,
          projectId,
          userId,
          channelKey: channelKey || `screen:${screenId}`,
        },
      });

      return NextResponse.json({
        success: true,
        screenId,
        eventId: ids[0],
      });
    }

    return NextResponse.json(
      { error: "Invalid request format", receivedKeys: Object.keys(body) },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Helper function to handle useAgent format
async function handleUseAgentFormat(
  data: {
    userMessage: {
      id: string;
      content: string;
      role: "user";
      state?: Record<string, unknown>;
    };
    threadId: string;
    history: unknown[];
    userId?: string;
    channelKey?: string;
  },
  authUserId: string
) {
  const { userMessage, threadId, history, channelKey } = data;

  // Extract screenId and projectId from state
  const state = userMessage.state as
    | { screenId?: string; projectId?: string }
    | undefined;
  const screenId = state?.screenId || threadId.replace("screen:", "");
  const projectId = state?.projectId || "";

  // Effective userId for data ownership
  const effectiveUserId = authUserId || channelKey;
  const finalChannelKey = channelKey || `screen:${screenId}`;

  // Send event to Inngest - matching the ChatRequestEvent format from @inngest/use-agent
  const { ids } = await inngest.send({
    name: "agent/chat.requested",
    data: {
      threadId,
      userMessage, // Pass the full userMessage object, not just content
      userId: effectiveUserId,
      channelKey: finalChannelKey,
      history,
      // Also include screenId and projectId for our custom handling
      screenId,
      projectId,
    },
  });

  return NextResponse.json({
    success: true,
    threadId,
    eventId: ids[0],
  });
}
