import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSubscriptionToken } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { userChannel } from "@/inngest/realtime";

export type RequestBody = {
  userId?: string;
  channelKey?: string;
};

/**
 * POST /api/realtime/token
 * Generates a realtime subscription token for authenticated users.
 * Used by the frontend to subscribe to agent streaming events.
 */
export async function POST(req: NextRequest) {
  const { userId: authUserId } = await auth();

  if (!authUserId) {
    return NextResponse.json(
      { error: "Please sign in to create a token" },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { userId: requestUserId, channelKey } = body;

    // Channel key resolution: prioritize channelKey, fallback to userId
    const subscriptionChannelKey = channelKey || requestUserId;

    if (!subscriptionChannelKey) {
      return NextResponse.json(
        { error: "userId or channelKey is required" },
        { status: 400 }
      );
    }

    // Create a subscription token for the resolved channel
    // This creates a channel with pattern: user:{channelKey}
    const token = await getSubscriptionToken(inngest, {
      channel: userChannel(subscriptionChannelKey),
      topics: ["agent_stream"],
    });

    return NextResponse.json(token);
  } catch {
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
