import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { z } from "zod";

const schema = z.object({
  message: z.string().min(1),
  screenId: z.string(), // Required: Convex screen ID
  projectId: z.string(), // Required: Convex project ID
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

    const { message, screenId, projectId } = result.data;

    // Send event to Inngest with screenId and projectId
    const { ids } = await inngest.send({
      name: "chat/message.sent",
      data: {
        message,
        screenId,
        projectId,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      screenId,
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
