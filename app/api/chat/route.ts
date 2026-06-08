import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { z } from "zod";

const schema = z.object({
  message: z.string().min(1),
  threadId: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Received body:", body);

    const result = schema.safeParse(body);

    if (!result.success) {
      console.log("Validation error:", result.error);
      return NextResponse.json(
        { error: "Invalid request", details: result.error.issues },
        { status: 400 }
      );
    }

    const { message, threadId } = result.data;
    const newThreadId = threadId || `thread-${Date.now()}-${userId}`;

    // Send event to Inngest
    const { ids } = await inngest.send({
      name: "chat/message.sent",
      data: {
        message,
        threadId: newThreadId,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      threadId: newThreadId,
      eventId: ids[0],
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
