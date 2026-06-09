import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";
import type { ReadFileResponse } from "@/lib/canvas/code-explorer-types";

// Auto-pause timeout for sandboxes (15 minutes)
const SANDBOX_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * GET /api/sandbox/files/content
 * Read file content from the sandbox
 *
 * Query params:
 * - sandboxId: E2B sandbox ID
 * - path: File path to read
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sandboxId = searchParams.get("sandboxId");
    const path = searchParams.get("path");

    if (!sandboxId) {
      return NextResponse.json<ReadFileResponse>(
        { content: "", error: "sandboxId is required" },
        { status: 400 }
      );
    }

    if (!path) {
      return NextResponse.json<ReadFileResponse>(
        { content: "", error: "path is required" },
        { status: 400 }
      );
    }

    // Connect to the sandbox
    let sandbox: Sandbox;
    try {
      sandbox = await Sandbox.connect(sandboxId, {
        timeoutMs: SANDBOX_TIMEOUT_MS,
      });
    } catch (error) {
      console.error("Failed to connect to sandbox:", error);
      return NextResponse.json<ReadFileResponse>(
        {
          content: "",
          error: "Failed to connect to sandbox. The session may have expired.",
        },
        { status: 503 }
      );
    }

    // Read file content
    try {
      const content = await sandbox.files.read(path);

      return NextResponse.json<ReadFileResponse>({ content });
    } catch (error) {
      console.error("Failed to read file:", error);
      return NextResponse.json<ReadFileResponse>(
        {
          content: "",
          error: `Failed to read file: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in sandbox file content API:", error);
    return NextResponse.json<ReadFileResponse>(
      {
        content: "",
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
