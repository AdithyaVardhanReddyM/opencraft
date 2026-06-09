import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";

// Auto-pause timeout for sandboxes (15 minutes)
const SANDBOX_AUTO_PAUSE_TIMEOUT_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { sandboxId } = await request.json();

    if (!sandboxId) {
      return NextResponse.json(
        { error: "sandboxId is required" },
        { status: 400 }
      );
    }

    // Connect to the sandbox - this automatically resumes if paused
    const sandbox = await Sandbox.connect(sandboxId, {
      timeoutMs: SANDBOX_AUTO_PAUSE_TIMEOUT_MS,
    });

    // Get the sandbox URL
    const host = sandbox.getHost(3000);
    const sandboxUrl = `https://${host}`;

    return NextResponse.json({
      success: true,
      sandboxId: sandbox.sandboxId,
      sandboxUrl,
    });
  } catch (error) {
    console.error("Failed to resume sandbox:", error);

    // Check if sandbox doesn't exist or is expired
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isNotFound =
      errorMessage.includes("not found") ||
      errorMessage.includes("does not exist");

    return NextResponse.json(
      {
        error: isNotFound
          ? "Sandbox session expired or not found"
          : "Failed to resume sandbox",
        details: errorMessage,
        expired: isNotFound,
      },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
