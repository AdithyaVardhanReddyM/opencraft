import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/threads
 * Stub endpoint for useAgents hook thread fetching.
 * We don't use thread management, so return empty array.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return empty threads array - we manage conversations via Convex
  return NextResponse.json({
    threads: [],
    hasMore: false,
  });
}
