import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";
import { parseLsOutput } from "@/lib/canvas/code-explorer-utils";
import type { ListFilesResponse } from "@/lib/canvas/code-explorer-types";

// Auto-pause timeout for sandboxes (15 minutes)
const SANDBOX_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * GET /api/sandbox/files
 * List files in a directory within the sandbox
 *
 * Query params:
 * - sandboxId: E2B sandbox ID
 * - path: Directory path to list (default: /home/user)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sandboxId = searchParams.get("sandboxId");
    const path = searchParams.get("path") || "/home/user";

    if (!sandboxId) {
      return NextResponse.json<ListFilesResponse>(
        { items: [], error: "sandboxId is required" },
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
      return NextResponse.json<ListFilesResponse>(
        {
          items: [],
          error: "Failed to connect to sandbox. The session may have expired.",
        },
        { status: 503 }
      );
    }

    // List directory contents
    try {
      const result = await sandbox.commands.run(`ls -la "${path}"`);

      if (result.exitCode !== 0) {
        return NextResponse.json<ListFilesResponse>(
          {
            items: [],
            error: `Failed to list directory: ${
              result.stderr || "Unknown error"
            }`,
          },
          { status: 500 }
        );
      }

      const items = parseLsOutput(result.stdout, path);

      return NextResponse.json<ListFilesResponse>({ items });
    } catch (error) {
      console.error("Failed to list directory:", error);
      return NextResponse.json<ListFilesResponse>(
        {
          items: [],
          error: `Failed to list directory: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in sandbox files API:", error);
    return NextResponse.json<ListFilesResponse>(
      {
        items: [],
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
