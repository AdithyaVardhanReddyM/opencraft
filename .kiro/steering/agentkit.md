---
inclusion: manual
---

# AgentKit by Inngest - Coding Agent Guide

## Overview

AgentKit is a TypeScript framework for building multi-agent networks with deterministic routing, rich tooling, and fault-tolerant orchestration via Inngest.

## Installation

```bash
pnpm install @inngest/agent-kit inngest @e2b/code-interpreter zod
pnpm install @inngest/use-agent  # For React UI streaming
```

**Note:** Starting with AgentKit v0.9.0, `inngest` is a required peer dependency.

## Core Concepts

### 1. Creating Agents

```typescript
import { createAgent, createTool } from "@inngest/agent-kit";
import { z } from "zod";

const codingAgent = createAgent({
  name: "Coding Agent",
  description: "An expert coding agent that writes and executes code",
  system: `You are a coding agent that helps users write and execute code.
Think step-by-step before starting any task.
When complete, provide a summary in <task_summary></task_summary> tags.`,
  model: openrouter({ model: "anthropic/claude-3.5-sonnet" }),
  tools: [
    /* tools array */
  ],
});
```

### 2. Creating Tools

```typescript
const writeFileTool = createTool({
  name: "write_file",
  description: "Write content to a file",
  parameters: z.object({
    path: z.string().describe("File path"),
    content: z.string().describe("File content"),
  }),
  handler: async ({ path, content }, { step, network }) => {
    // Use step.run for durable execution with automatic retries
    return await step?.run("write-file", async () => {
      // Implementation
      return { success: true, path };
    });
  },
});
```

### 3. Networks

Networks combine agents with routing logic:

```typescript
import { createNetwork } from "@inngest/agent-kit";

const codingNetwork = createNetwork({
  name: "coding-network",
  agents: [codingAgent, reviewerAgent, executorAgent],
  defaultModel: openrouter({ model: "anthropic/claude-3.5-sonnet" }),
  router: ({ network, lastResult }) => {
    // State-based routing
    if (network?.state.kv.get("completed")) {
      return undefined; // Stop network
    }
    return codingAgent;
  },
});
```

### 4. Routers

**Simple Router Function:**

```typescript
router: ({ network, lastResult }) => {
  const state = network.state.data;
  if (!state.codeWritten) return codingAgent;
  if (!state.codeReviewed) return reviewerAgent;
  if (!state.codeExecuted) return executorAgent;
  return undefined; // Done
};
```

**Routing Agent (LLM-based):**

```typescript
import { createRoutingAgent } from "@inngest/agent-kit";

const router = createRoutingAgent({
  name: "Code Assistant Router",
  system: async ({ network }) => {
    const agents = await network?.availableAgents();
    return `You orchestrate agents: ${agents.map((a) => a.name).join(", ")}`;
  },
  tools: [selectAgentTool],
  lifecycle: {
    onRoute: ({ result }) => {
      const agentName = result.toolCalls[0]?.content;
      return agentName === "finished" ? undefined : [agentName];
    },
  },
});
```

## OpenRouter Provider

Since AgentKit uses OpenAI-compatible APIs, configure OpenRouter via the `openai` provider with custom baseUrl:

```typescript
import { openai } from "@inngest/agent-kit";

// OpenRouter configuration
const openrouter = (config: { model: string; maxTokens?: number }) =>
  openai({
    model: config.model,
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: "https://openrouter.ai/api/v1",
    defaultParameters: {
      max_tokens: config.maxTokens || 4096,
    },
  });

// Usage
const agent = createAgent({
  name: "Coding Agent",
  model: openrouter({ model: "anthropic/claude-3.5-sonnet" }),
  // ...
});
```

## State Management

### Creating Typed State

```typescript
import { createState } from "@inngest/agent-kit";

interface CodingState {
  userId: string;
  files: Record<string, string>;
  currentTask?: string;
  sandboxId?: string;
}

const state = createState<CodingState>({
  userId: "user-123",
  files: {},
  currentTask: undefined,
});
```

### Accessing State in Tools

```typescript
const tool = createTool({
  name: "save_file",
  parameters: z.object({ filename: z.string(), content: z.string() }),
  handler: ({ filename, content }, { network }) => {
    // Read/write state
    const files = network.state.data.files || {};
    files[filename] = content;
    network.state.data.files = files;

    // Key-value store
    network?.state.kv.set("lastFile", filename);
    const lastFile = network?.state.kv.get("lastFile");
  },
});
```

## History & Persistence

### History Adapter

```typescript
const network = createNetwork({
  name: "coding-network",
  agents: [codingAgent],
  history: {
    create: async ({ state, input }) => {
      return { threadId: `thread-${Date.now()}-${state.data.userId}` };
    },
    get: async ({ threadId }) => {
      const history = await db.getThread(threadId);
      return history.results;
    },
    appendUserMessage: async ({ threadId, userMessage, step }) => {
      await step?.run("save-message", () =>
        db.saveMessage(threadId, userMessage)
      );
    },
    appendResults: async ({ threadId, results }) => {
      await db.saveResults(threadId, results);
    },
  },
});
```

### Running with Thread ID

```typescript
const result = await network.run("Write a function", {
  state: createState(
    { userId: "user-123", files: {} },
    { threadId: "existing-thread-id", results: previousResults }
  ),
});
```

## E2B Sandbox Integration

### Setup Sandbox Tools

```typescript
import { Sandbox } from "@e2b/code-interpreter";

// Sandbox manager
let sandbox: Sandbox | null = null;

async function getSandbox(network: any): Promise<Sandbox> {
  const existingId = network?.state.kv.get("sandboxId");
  if (existingId && sandbox) return sandbox;

  sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY });
  network?.state.kv.set("sandboxId", sandbox.sandboxId);
  return sandbox;
}

// Terminal tool
const terminalTool = createTool({
  name: "terminal",
  description: "Run shell commands in the sandbox",
  parameters: z.object({ command: z.string() }),
  handler: async ({ command }, { network }) => {
    const sandbox = await getSandbox(network);
    const result = await sandbox.commands.run(command);
    return result.stdout || result.stderr;
  },
});

// File write tool
const writeFileTool = createTool({
  name: "write_file",
  description: "Write files to the sandbox",
  parameters: z.object({
    files: z.array(
      z.object({
        path: z.string(),
        content: z.string(),
      })
    ),
  }),
  handler: async ({ files }, { network }) => {
    const sandbox = await getSandbox(network);
    for (const file of files) {
      await sandbox.files.write(file.path, file.content);
    }
    return `Files written: ${files.map((f) => f.path).join(", ")}`;
  },
});

// Read file tool
const readFileTool = createTool({
  name: "read_file",
  description: "Read a file from the sandbox",
  parameters: z.object({ path: z.string() }),
  handler: async ({ path }, { network }) => {
    const sandbox = await getSandbox(network);
    return await sandbox.files.read(path);
  },
});
```

## UI Streaming with useAgent

### Provider Setup

```tsx
// app/providers.tsx
import { AgentProvider, createDefaultAgentTransport } from "@inngest/use-agent";
import { useMemo } from "react";

export function AgentProviderWrapper({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const transport = useMemo(
    () =>
      createDefaultAgentTransport({
        api: {
          sendMessage: "/api/chat",
          fetchThreads: "/api/threads",
          getRealtimeToken: "/api/realtime/token",
        },
        headers: () => ({
          Authorization: `Bearer ${getAuthToken()}`,
        }),
      }),
    [userId]
  );

  return (
    <AgentProvider
      userId={userId}
      transport={transport}
      debug={process.env.NODE_ENV === "development"}
    >
      {children}
    </AgentProvider>
  );
}
```

### Chat Component

```tsx
import { useAgent } from "@inngest/use-agent";

export function ChatUI() {
  const { messages, sendMessage, status, isConnected } = useAgent({
    threadId: "conversation-123",
    userId: "user-456",
    debug: true,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const message = formData.get("message") as string;
    if (message.trim()) {
      sendMessage(message);
      e.currentTarget.reset();
    }
  };

  return (
    <div>
      <div className={`status ${isConnected ? "connected" : "disconnected"}`}>
        {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
      </div>

      <div className="messages">
        {messages.map(({ id, role, parts }) => (
          <div key={id} className={`message ${role}`}>
            <strong>{role}</strong>
            {parts.map((part, i) => {
              if (part.type === "text") return <p key={i}>{part.content}</p>;
              if (part.type === "tool-call") {
                return (
                  <div key={i} className="tool-call">
                    <div>Tool: {part.toolName}</div>
                    <pre>Status: {part.state}</pre>
                    <pre>Input: {JSON.stringify(part.input, null, 2)}</pre>
                    {part.output && (
                      <pre>Output: {JSON.stringify(part.output, null, 2)}</pre>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}
      </div>

      {/* Status indicator */}
      {status === "thinking" && <div>Thinking...</div>}
      {status === "calling-tool" && <div>Executing tool...</div>}
      {status === "responding" && <div>Streaming response...</div>}

      <form onSubmit={handleSubmit}>
        <input
          name="message"
          placeholder="Ask anything..."
          disabled={status !== "idle"}
        />
        <button type="submit" disabled={status !== "idle"}>
          Send
        </button>
      </form>
    </div>
  );
}
```

### Multi-Thread Support

```tsx
function MultiThreadChat() {
  const { threads, currentThreadId, setCurrentThread, messages, sendMessage } =
    useAgent({
      threadId: "primary-thread",
      userId: "user-123",
    });

  return (
    <div className="flex">
      <aside>
        {Object.entries(threads).map(([threadId, state]) => (
          <button
            key={threadId}
            onClick={() => setCurrentThread(threadId)}
            className={threadId === currentThreadId ? "active" : ""}
          >
            {threadId} ({state.messages.length} messages)
            {state.hasNewMessages && " 🔴"}
          </button>
        ))}
      </aside>
      <main>{/* Chat UI */}</main>
    </div>
  );
}
```

## Server Setup

### Inngest Client

```typescript
// lib/inngest/client.ts
import { Inngest } from "inngest";
import { realtimeMiddleware } from "@inngest/realtime";

export const inngest = new Inngest({
  id: "coding-agent-app",
  middleware: [realtimeMiddleware()], // Enable streaming
});
```

### API Routes (Next.js)

```typescript
// app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { runAgentNetwork } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runAgentNetwork],
});
```

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { inngest } from "@/lib/inngest/client";
import { z } from "zod";

const schema = z.object({
  userMessage: z.object({
    id: z.string(),
    content: z.string(),
    role: z.literal("user"),
  }),
  threadId: z.string().optional(),
  channelKey: z.string(),
});

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = schema.safeParse(await req.json());
  if (!result.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await inngest.send({
    name: "agent/chat.requested",
    data: { ...result.data, userId },
  });

  return NextResponse.json({ success: true });
}
```

### Agent Network Function

```typescript
// lib/inngest/functions.ts
import { createState } from "@inngest/agent-kit";
import { inngest } from "./client";
import { codingNetwork } from "./network";

export const runAgentNetwork = inngest.createFunction(
  { id: "run-coding-agent" },
  { event: "agent/chat.requested" },
  async ({ event, step }) => {
    const { userMessage, threadId, userId, channelKey } = event.data;

    const state = createState(
      { userId, files: {} },
      { threadId: threadId || `thread-${Date.now()}` }
    );

    const result = await codingNetwork.run(userMessage.content, { state });

    return { success: true, threadId: state.threadId, result };
  }
);
```

## Inngest Steps & Workflows

### Durable Steps

```typescript
// Inside tool handlers or functions
handler: async ({ query }, { step }) => {
  // Automatic retries on failure
  const result = await step?.run("search-docs", async () => {
    return await searchDocumentation(query);
  });
  return result;
};
```

### Multi-Step Tools

```typescript
export const researchTool = inngest.createFunction(
  { id: "research-tool" },
  { event: "research-tool/run" },
  async ({ event, step }) => {
    const { input } = event.data;

    // Step 1: Generate queries
    const queries = await step.ai.infer("generate-queries", {
      model: step.ai.models.openai({ model: "gpt-4o" }),
      body: {
        messages: [
          { role: "user", content: `Generate search queries for: ${input}` },
        ],
      },
    });

    // Step 2: Parallel execution
    const results = await Promise.all(
      queries.map((q) => step.run("search", () => performSearch(q)))
    );

    // Step 3: Summarize
    const summary = await step.ai.infer("summarize", {
      model: step.ai.models.openai({ model: "gpt-4o" }),
      body: {
        messages: [
          { role: "user", content: `Summarize: ${results.join("\n")}` },
        ],
      },
    });

    return summary.choices[0].message.content;
  }
);
```

## Agent Lifecycle Hooks

```typescript
const agentWithLifecycle = createAgent({
  name: "Coding Agent",
  system: "You are a coding assistant",
  lifecycle: {
    async onStart({ input, prompt }) {
      // Modify prompt before execution
      const context = await fetchRelevantContext(input);
      prompt.push({ role: "system", content: `Context: ${context}` });
      return { prompt, stop: false };
    },
    async onFinish({ result, network }) {
      // Post-processing after agent completes
      await saveToMemory(result, network.state.data);
    },
  },
});
```

## Environment Variables

```env
# OpenRouter
OPENROUTER_API_KEY=sk-or-...

# E2B Sandbox
E2B_API_KEY=e2b_...

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Optional: Direct provider keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

## Best Practices

1. **Use `step.run()` for durability** - Wrap external calls in steps for automatic retries
2. **Type your state** - Use TypeScript interfaces for state management
3. **Memoize transport** - Use `useMemo` for AgentProvider transport to prevent reconnections
4. **Clean up sandboxes** - Implement sandbox cleanup in agent lifecycle hooks
5. **Handle errors gracefully** - Use try/catch in tool handlers and return meaningful error messages
6. **Use KV store for flags** - Use `network.state.kv` for routing decisions
7. **Batch operations** - Use parallel execution with `Promise.all` where possible

## Human in the Loop

Use `step.waitForEvent` to pause execution and wait for human input:

```typescript
const askDeveloperTool = createTool({
  name: "ask_developer",
  description: "Ask a developer for input on a technical issue",
  parameters: z.object({
    question: z.string().describe("The technical question"),
    context: z.string().describe("Additional context"),
  }),
  handler: async ({ question, context }, { step }) => {
    if (!step) return { error: "Requires step context" };

    // Send notification (e.g., Slack, email)
    await step.run("notify-developer", () => sendSlackMessage(question));

    // Wait for response event (up to 4 hours)
    const response = await step.waitForEvent("developer.response", {
      event: "app/developer.response",
      timeout: "4h",
      match: "data.ticketId", // Match by ticket ID
    });

    if (!response) return { error: "No response received" };

    return {
      answer: response.data.answer,
      timestamp: response.data.timestamp,
    };
  },
});
```

Resume by sending the matching event:

```typescript
await inngest.send({
  name: "app/developer.response",
  data: {
    ticketId: "T125",
    answer: "The fix is deployed in v2.1.0",
    timestamp: new Date().toISOString(),
  },
});
```

## Retries & Concurrency

### Configure Retries

```typescript
const networkFunction = inngest.createFunction(
  {
    id: "coding-network",
    retries: 3, // Max retry attempts
  },
  { event: "agent/run" },
  async ({ event, step }) => {
    return network.run(event.data.input);
  }
);
```

### Multi-tenancy with Concurrency

```typescript
const networkFunction = inngest.createFunction(
  {
    id: "coding-network",
    concurrency: [
      {
        key: "event.data.userId", // Per-user limit
        limit: 5,
      },
      {
        key: "event.data.orgId", // Per-org limit
        limit: 20,
      },
    ],
  },
  { event: "agent/run" },
  async ({ event }) => {
    return network.run(event.data.input);
  }
);
```

### Network Max Iterations

```typescript
const network = createNetwork({
  agents: [codingAgent, reviewerAgent],
  maxIter: 10, // Prevent infinite loops
  router: routingAgent,
});
```

## Streaming Events

Handle real-time events in the UI:

```typescript
useAgent({
  threadId: "thread-123",
  onEvent: (evt, meta) => {
    console.log("Event:", evt.event, "Thread:", meta.threadId);
    if (evt.event === "run.started") showThinkingIndicator();
    if (evt.event === "tool.called") showToolExecution(evt.data);
  },
  onError: (error) => {
    console.error("Streaming error:", error);
    if (error.recoverable) scheduleRetry();
  },
});
```

### Tool Call Approval (Human Review)

```tsx
{
  part.type === "tool-call" && part.state === "awaiting-approval" && (
    <div>
      <p>Tool: {part.toolName}</p>
      <pre>{JSON.stringify(part.input, null, 2)}</pre>
      <button onClick={() => approveToolCall(part.toolCallId, "Approved")}>
        ✅ Approve
      </button>
      <button onClick={() => rejectToolCall(part.toolCallId, "Rejected")}>
        ❌ Reject
      </button>
    </div>
  );
}
```

## Local Development

```bash
# Start Inngest dev server
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest

# Start your app
pnpm dev

```

## References

- [AgentKit Docs](https://agentkit.inngest.com/)
- [Inngest Docs](https://www.inngest.com/docs)
- [E2B Docs](https://e2b.dev/docs)
