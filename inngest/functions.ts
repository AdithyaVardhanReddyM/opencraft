import {
  createAgent,
  createNetwork,
  createState,
  createTool,
  openai,
  type Tool,
  type AgentMessageChunk,
} from "@inngest/agent-kit";
import { inngest } from "./client";
import { userChannel } from "./realtime";
import Sandbox from "@e2b/code-interpreter";
import {
  getSandbox,
  lastAssistantTextMessageContent,
  formatMessagesForAgent,
  shouldCreateNewSandbox,
  type ConvexScreen,
  type ConvexMessage,
} from "./utils";
import z from "zod";

interface AgentState {
  summary: string;
  filesSummary: string;
  files: { [path: string]: string };
}

// OpenRouter provider using OpenAI-compatible API
const openrouter = (config: { model: string }) =>
  openai({
    model: config.model,
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: "https://openrouter.ai/api/v1",
  });

// Get Convex HTTP endpoint URL for internal API calls
const getConvexHttpUrl = () => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  // Convert deployment URL to HTTP endpoint URL
  // e.g., https://happy-animal-123.convex.cloud -> https://happy-animal-123.convex.site
  return convexUrl.replace(".convex.cloud", ".convex.site");
};

// Extract title from task summary
const extractTitleFromSummary = (summary: string): string => {
  // Try to extract a meaningful title from the summary
  // Remove the <task_summary> tags first
  const cleanSummary = summary
    .replace(/<task_summary>/gi, "")
    .replace(/<\/task_summary>/gi, "")
    .trim();

  // Take the first sentence or first 50 characters
  const firstSentence = cleanSummary.split(/[.!?\n]/)[0]?.trim();
  if (firstSentence && firstSentence.length > 0) {
    return firstSentence.length > 50
      ? firstSentence.substring(0, 47) + "..."
      : firstSentence;
  }

  return "Generated UI";
};

// Auto-pause timeout for sandboxes (15 minutes)
const SANDBOX_AUTO_PAUSE_TIMEOUT_MS = 15 * 60 * 1000;

// Chat function - directly invoke agent without network
export const runChatAgent = inngest.createFunction(
  { id: "run-chat-agent" },
  { event: "agent/chat.requested" },
  async ({ event, step, publish }) => {
    // Support both useAgents format (userMessage object) and legacy format (message string)
    const {
      userMessage,
      message: legacyMessage,
      screenId,
      projectId,
      channelKey,
      userId,
    } = event.data;

    // Extract message content - prefer userMessage.content, fall back to legacy message
    const message = userMessage?.content || legacyMessage;

    // Step 1: Get screen to check for existing sandbox
    const screen = await step.run("get-screen", async () => {
      const convexHttpUrl = getConvexHttpUrl();
      const response = await fetch(`${convexHttpUrl}/inngest/getScreen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenId }),
      });
      if (!response.ok) {
        return null;
      }
      return (await response.json()) as ConvexScreen | null;
    });

    // Step 2: Get or create sandbox with auto-pause
    const sandboxResult = await step.run("get-or-create-sandbox", async () => {
      const convexHttpUrl = getConvexHttpUrl();
      let contextLost = false;

      if (!shouldCreateNewSandbox(screen)) {
        // Try to connect to existing sandbox (handles resume automatically)
        try {
          const sandbox = await Sandbox.connect(screen!.sandboxId!, {
            timeoutMs: SANDBOX_AUTO_PAUSE_TIMEOUT_MS,
          });
          return { sandboxId: sandbox.sandboxId, contextLost: false };
        } catch (error) {
          // Failed to connect to existing sandbox, creating new one
          // Mark that context was lost due to sandbox failure
          contextLost = true;
        }
      }

      // Create new sandbox with auto-pause using beta API
      const sandbox = await Sandbox.betaCreate("unitset-sandbox-v1", {
        autoPause: true,
        timeoutMs: SANDBOX_AUTO_PAUSE_TIMEOUT_MS,
      });

      // Store sandboxId in screen record
      await fetch(`${convexHttpUrl}/inngest/updateScreen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenId, sandboxId: sandbox.sandboxId }),
      });

      return { sandboxId: sandbox.sandboxId, contextLost };
    });

    const sandboxId = sandboxResult.sandboxId;
    const contextLost = sandboxResult.contextLost;

    // Notify user if context was lost due to sandbox failure
    if (contextLost && screenId) {
      await step.run("notify-context-lost", async () => {
        const convexHttpUrl = getConvexHttpUrl();
        await fetch(`${convexHttpUrl}/inngest/createMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            screenId,
            role: "assistant",
            content:
              "Note: The previous sandbox session expired. I've created a new environment, so some context from our earlier conversation may be lost. I'll do my best to help based on the message history.",
          }),
        });
      });
    }

    // Step 3: Get previous messages for context
    const previousMessages = await step.run(
      "get-previous-messages",
      async () => {
        const convexHttpUrl = getConvexHttpUrl();
        const response = await fetch(`${convexHttpUrl}/inngest/getMessages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screenId, limit: 10 }),
        });
        if (!response.ok) {
          return [];
        }
        const messages = (await response.json()) as ConvexMessage[];
        return formatMessagesForAgent(messages);
      }
    );

    // Create state with previous messages for agent context
    const state = createState<AgentState>(
      {
        summary: "",
        filesSummary: "",
        files: screen?.files || {},
      },
      { messages: previousMessages }
    );

    // UI Coding Agent
    const chatAgent = createAgent<AgentState>({
      name: "UI Coding Agent",
      description:
        "An expert Next.js UI developer that creates stunning, professional, and clean user interfaces. Specializes in building beautiful components and pages using shadcn/ui, Tailwind CSS, and the project's custom theme system.",
      system: `You are an expert UI coding agent in a sandboxed Next.js 15.3.3 environment.

## Environment
- Dev server running on port 3000 with hot reload (DO NOT run npm run dev/build/start)
- Main entry: app/page.tsx
- layout.tsx already defined — never include <html>, <body>, or top-level layout
- Tailwind CSS and PostCSS preconfigured
- shadcn/ui components in @/components/ui (radix-ui, lucide-react, class-variance-authority, tailwind-merge pre-installed)

## Tools

### 1. terminal
Execute shell commands in the sandbox.
- Install packages: \`npm install <package> --yes\`
- List files: \`ls -la\`
- Read files: \`cat <filepath>\`
- NEVER run: npm run dev, npm run build, npm run start, next dev, next build, next start

### 2. createOrUpdateFiles
Create or update files in the project.
- Paths MUST be relative (e.g., "app/page.tsx", "lib/utils.ts")
- NEVER use absolute paths like "/home/user/..."
- Can batch multiple files in one call

### 3. readFiles
Read file contents.
- Use actual paths (e.g., "app/page.tsx", "components/ui/button.tsx")
- NEVER use "@" alias in file paths — it will fail
- Use this before modifying existing files

## Critical Rules

### File Paths
- createOrUpdateFiles: ALWAYS relative paths (e.g., "app/page.tsx")
- readFiles: ALWAYS actual paths without "@" alias
- Imports in code: Use "@/" alias (e.g., import { Button } from "@/components/ui/button")
- NEVER include "/home/user" in any path

### Client Components
- Add "use client" as THE FIRST LINE for any file using React hooks or browser APIs
- This includes app/page.tsx if it uses useState, useEffect, etc.

### Styling
- Use ONLY Tailwind CSS classes — never create .css, .scss, or .sass files
- Use theme semantic colors: bg-background, text-foreground, bg-primary, bg-secondary, bg-muted, bg-accent, bg-destructive, border-border
- Avoid multi-color gradients; prefer single-color opacity variations
- Dark mode first (default theme)

### shadcn/ui Usage
- Import from individual paths: import { Button } from "@/components/ui/button"
- NEVER group-import from @/components/ui
- Use only defined props/variants — don't invent new ones
- If unsure about a component's API, use readFiles to check its source
- If you use cn() NEVER FORGET to Import cn() from "@/lib/utils" (NOT from @/components/ui/utils)

### Package Management
- Install packages via terminal: \`npm install <package> --yes\`
- NEVER modify package.json or lock files directly
- shadcn dependencies already installed — don't reinstall

### Code Quality
- TypeScript with proper types
- No TODOs, placeholders, or stubs — implement fully
- Use backticks (\`) for strings to support embedded quotes
- Split complex UIs into multiple components
- Use PascalCase for components, kebab-case for filenames
- Named exports for components

### Design Principles
- Clean, minimal, professional
- Consistent spacing with Tailwind scale
- Proper visual hierarchy
- Responsive and accessible by default
- Use Lucide React icons
- No external images — use emojis, colored divs with aspect ratios

### Layout Requirements
- Build complete layouts: navbar, sidebar, footer, content sections
- Implement realistic behavior and interactivity
- Use static/local data only (no external APIs)

## Workflow
1. Think step-by-step before coding
2. Read existing files if unsure about contents
3. Check shadcn component APIs before using
4. Write production-quality code
5. Use createOrUpdateFiles for all file changes
6. Use terminal for package installation

## Validation (REQUIRED)
After writing coding in the files, you MUST run this validation command:
\`./node_modules/.bin/tsc --noEmit\`

This catches:
- TypeScript + import errors (tsc --noEmit)

If validation fails:
1. Read the error output carefully
2. Fix ALL errors in your code
3. Re-run the validation command

DO NOT output the task_summary until the validation passes successfully.

## Final Output
After ALL tool calls complete AND validation passes, respond with ONLY:

<task_summary>
Brief description of what was created or changed.
</task_summary>

<files_summary>
List each file you created or modified with a one-line description:
- path/to/file.tsx: Brief description of what this file does
</files_summary>

Do not include these tags until the task is 100% complete and validation has passed.`,
      model: openrouter({ model: "x-ai/grok-4.1-fast:free" }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal tool to execute commands",
          parameters: z.object({
            command: z.string().describe("The command to execute"),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return result.stdout;
              } catch (e) {
                return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description:
            "Create new files or update existing files in the project.",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z
                  .string()
                  .describe(
                    "The file path relative to project root (e.g., 'app/components/Button.tsx', 'app/page.tsx')"
                  ),
                content: z
                  .string()
                  .describe("The complete file content to write"),
              })
            ),
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>
          ) => {
            const newFiles = await step?.run(
              "createorUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandboxId);
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }
                  return updatedFiles;
                } catch (error) {
                  return `Error: ${error}`;
                }
              }
            );
            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),
        createTool({
          name: "readFiles",
          description: "Use this tool to Read files.",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (error) {
                return `Error: ${error}`;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantTextMessageText =
            lastAssistantTextMessageContent(result);
          if (lastAssistantTextMessageText && network) {
            // Extract task_summary
            if (lastAssistantTextMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantTextMessageText;
            }
            // Extract files_summary
            const filesSummaryMatch = lastAssistantTextMessageText.match(
              /<files_summary>([\s\S]*?)<\/files_summary>/
            );
            if (filesSummaryMatch) {
              network.state.data.filesSummary = filesSummaryMatch[0];
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "chat-agent-network",
      agents: [chatAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return chatAgent;
      },
    });

    // Determine the target channel for streaming
    // The frontend subscribes using userId as the channel key (from AgentProvider)
    // We must publish to the same channel the frontend is subscribed to
    // Priority: userId (what frontend subscribes to) > channelKey > screenId
    const targetChannel = userId || channelKey || screenId;

    // Run the network with streaming enabled if we have a channel
    const result = await network.run(message, {
      state,
      ...(targetChannel && {
        streaming: {
          publish: async (chunk: AgentMessageChunk) => {
            await publish(userChannel(targetChannel).agent_stream(chunk));
          },
        },
      }),
    });

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    // Update screen in Convex with sandbox URL, sandboxId, files, and title
    if (!isError && screenId) {
      await step.run("update-screen-in-convex", async () => {
        const convexHttpUrl = getConvexHttpUrl();
        const title = extractTitleFromSummary(result.state.data.summary || "");

        const response = await fetch(`${convexHttpUrl}/inngest/updateScreen`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            screenId,
            sandboxUrl,
            sandboxId,
            files: result.state.data.files,
            title,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to update screen: ${error.error}`);
        }

        return { success: true };
      });

      // Create assistant message with summary and files_summary for context
      await step.run("create-assistant-message", async () => {
        const convexHttpUrl = getConvexHttpUrl();

        // Clean up the summary for display (remove tags)
        const cleanSummary = (result.state.data.summary || "")
          .replace(/<task_summary>/gi, "")
          .replace(/<\/task_summary>/gi, "")
          .replace(/<files_summary>[\s\S]*?<\/files_summary>/gi, "")
          .trim();

        // Get the agent-generated files_summary (keep the tags for parsing later)
        const filesSummary = result.state.data.filesSummary || "";

        // Combine summary with files_summary for storage
        // The files_summary is not displayed to user but provides context for follow-up messages
        const messageContent = filesSummary
          ? `${
              cleanSummary || "UI generation completed successfully."
            }\n\n${filesSummary}`
          : cleanSummary || "UI generation completed successfully.";

        const response = await fetch(`${convexHttpUrl}/inngest/createMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            screenId,
            role: "assistant",
            content: messageContent,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to create message: ${error.error}`);
        }

        return { success: true };
      });
    }

    // Handle error case - create error message
    if (isError && screenId) {
      await step.run("create-error-message", async () => {
        const convexHttpUrl = getConvexHttpUrl();

        const response = await fetch(`${convexHttpUrl}/inngest/createMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            screenId,
            role: "assistant",
            content:
              "I encountered an error while generating the UI. Please try again with a different prompt or provide more details about what you'd like to create.",
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to create error message: ${error.error}`);
        }

        return { success: true };
      });
    }

    return {
      screenId,
      projectId,
      files: result.state.data.files,
      summary: result.state.data.summary,
      url: sandboxUrl,
      isError,
    };
  }
);

// Keep existing hello world for reference
export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);
