import {
  createAgent,
  createNetwork,
  createTool,
  openai,
  type Tool,
} from "@inngest/agent-kit";
import { inngest } from "./client";
import Sandbox from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import z from "zod";

interface AgentState {
  summary: string;
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

// Chat function - directly invoke agent without network
export const runChatAgent = inngest.createFunction(
  { id: "run-chat-agent" },
  { event: "chat/message.sent" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("unitset-sandbox-v1");
      return sandbox.sandboxId;
    });

    const { message, screenId, projectId } = event.data;

    // const previousMessages = await step.run(
    //   "get-previous-messages",
    //   async () => {
    //     const formattedMessages: Message[] = [];

    //     //convex query to fetch prev messages for this screen, orderby created ay desc -> take 5 -> reverse order
    //     messages = [];

    //     for (const message of messages) {
    //       formattedMessages.push({
    //         type: "text",
    //         role: message.role === "ASSISTANT" ? "assistant" : "user",
    //         content: message.content,
    //       });
    //     }
    //     return formattedMessages;
    //   }
    // );

    // add this after implementing above step
    // const state = createState<AgentState>(
    //   {
    //     summary: "",
    //     files: {},
    //   },
    //   { messages: previosMessages }
    // );

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

Do not include this until the task is 100% complete and validation has passed.`,
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
                console.error(
                  `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`
                );
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
            if (lastAssistantTextMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantTextMessageText;
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
      // defaultState: state  (add this after adding state code above)
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return chatAgent;
      },
    });

    const result = await network.run(message);
    // const result = await network.run(message, {state}); (Use this after adding state)

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    // Update screen in Convex with sandbox URL, files, and title
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

      // Create assistant message with summary
      await step.run("create-assistant-message", async () => {
        const convexHttpUrl = getConvexHttpUrl();

        // Clean up the summary for display
        const cleanSummary = (result.state.data.summary || "")
          .replace(/<task_summary>/gi, "")
          .replace(/<\/task_summary>/gi, "")
          .trim();

        const response = await fetch(`${convexHttpUrl}/inngest/createMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            screenId,
            role: "assistant",
            content: cleanSummary || "UI generation completed successfully.",
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
