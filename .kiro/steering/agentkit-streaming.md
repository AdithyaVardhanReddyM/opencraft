---
inclusion: manual
---

# AgentKit Streaming Guide

## Overview

AgentKit provides real-time streaming for agent networks using the `@inngest/use-agent` hook. This enables seamless streaming of agent responses, tool calls, and durable steps to your React UI. The hook consumes structured events and maintains UI state for single or parallel conversations.

## Installation

```bash
pnpm install @inngest/use-agent
```

## Architecture Flow

```
User Message → /api/chat → Inngest Event → AgentKit Network → Realtime Channel → useAgent Hook → UI
```

1. User sends message via UI
2. `/api/chat` receives request and sends Inngest event
3. Inngest function runs agent network with streaming enabled
4. Agent chunks published to realtime channel
5. `useAgent` hook receives events and updates UI state
6. React UI re-renders with new messages/tool calls

## Required Endpoints

| Endpoint                       | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| `/api/inngest/client.ts`       | Inngest client with `realtimeMiddleware`   |
| `/api/inngest/realtime.ts`     | Typed realtime channel and topic           |
| `/api/chat/route.ts`           | Receives messages, triggers Inngest event  |
| `/api/realtime/token/route.ts` | Generates subscription tokens for frontend |
| `/api/inngest/route.ts`        | Standard Inngest handler                   |

## Server Setup

### 1. Inngest Client with Realtime Middleware

```typescript
// app/api/inngest/client.ts
import { Inngest } from "inngest";
import { realtimeMiddleware } from "@inngest/realtime";

export const inngest = new Inngest({
  id: "unit-set",
  isDev: process.env.NODE_ENV === "development",
  middleware: [realtimeMiddleware()],
});
```

### 2. Realtime Channel Definition

```typescript
// app/api/inngest/realtime.ts
import { channel } from "@inngest/realtime";
import type { AgentMessageChunk } from "@inngest/agent-kit";

export const createChannel = (channelKey: string) =>
  channel(channelKey).topic("agent_stream", {} as AgentMessageChunk);
```

### 3. Token Endpoint

```typescript
// app/api/realtime/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { inngest } from "../inngest/client";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channelKey } = await req.json();

  const token = await inngest.realtime.getToken({
    channel: channelKey,
    topics: ["agent_stream"],
  });

  return NextResponse.json({ token });
}
```

### 4. Chat Route

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { inngest } from "../inngest/client";
import { z } from "zod";

const schema = z.object({
  userMessage: z.object({
    id: z.string(),
    content: z.string(),
    role: z.literal("user"),
    state: z.record(z.unknown()).optional(),
  }),
  threadId: z.string().optional(),
  channelKey: z.string(),
  history: z.array(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = schema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { ids } = await inngest.send({
    name: "agent/chat.requested",
    data: { ...result.data, userId },
  });

  return NextResponse.json({ success: true, eventId: ids[0] });
}
```

## Type Definitions

### Server-Side Types

```typescript
// types/agent.ts
import { createToolManifest, type StateData } from "@inngest/agent-kit";
import { generateCodeTool, executeCodeTool } from "./tools";

// Server-side state used by networks, routers, and agents
export type AgentState = StateData & {
  userId?: string;
  sandboxId?: string;
  files?: Record<string, string>;
  currentTask?: string;
};

// Typed manifest of all available tools
const manifest = createToolManifest([
  generateCodeTool,
  executeCodeTool,
] as const);

export type ToolManifest = typeof manifest;
```

### Client-Side Types

```typescript
// hooks/use-chat-agent.ts
import {
  useAgent,
  type AgentKitEvent,
  type UseAgentsConfig,
  type UseAgentsReturn,
} from "@inngest/use-agent";
import type { ToolManifest } from "@/types/agent";

// Client-side state sent with each message
export type ClientState = {
  screenId: string;
  projectId: string;
  currentFiles?: Record<string, string>;
};

export type AgentConfig = { tools: ToolManifest; state: ClientState };
export type AgentEvent = AgentKitEvent<ToolManifest>;

export function useChatAgent(
  config: UseAgentsConfig<ToolManifest, ClientState>
): UseAgentsReturn<ToolManifest, ClientState> {
  return useAgent<{ tools: ToolManifest; state: ClientState }>(config);
}
```

## Agent Network with Streaming

```typescript
// inngest/functions.ts
import { createState, type AgentMessageChunk } from "@inngest/agent-kit";
import type { ChatRequestEvent } from "@inngest/use-agent";
import { v4 as uuidv4 } from "uuid";
import { inngest } from "./client";
import { createChannel } from "./realtime";
import { codingNetwork } from "./network";
import type { AgentState } from "@/types/agent";

export const runChatAgent = inngest.createFunction(
  {
    id: "run-chat-agent",
    name: "Chat Agent",
  },
  { event: "agent/chat.requested" },
  async ({ event, publish, step }) => {
    const {
      threadId: providedThreadId,
      userMessage,
      userId,
      channelKey,
      history,
    } = event.data as ChatRequestEvent;

    if (!userId) {
      throw new Error("userId is required");
    }

    const threadId = await step.run("generate-thread-id", async () => {
      return providedThreadId || uuidv4();
    });

    const targetChannel = await step.run("get-target-channel", async () => {
      return channelKey || userId;
    });

    try {
      const clientState = userMessage.state || {};

      const networkState = createState<AgentState>(
        {
          userId,
          ...clientState,
        },
        {
          messages: history,
          threadId,
        }
      );

      // Run network with streaming enabled
      await codingNetwork.run(userMessage, {
        state: networkState,
        streaming: {
          publish: async (chunk: AgentMessageChunk) => {
            // Publish chunks to realtime channel
            await publish(createChannel(targetChannel).agent_stream(chunk));
          },
        },
      });

      return {
        success: true,
        threadId,
        message: "Agent completed successfully",
      };
    } catch (error) {
      // Emit error chunk
      await publish(
        createChannel(targetChannel).agent_stream({
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      );
      throw error;
    }
  }
);
```

## React Integration

### Basic useAgent Hook

```tsx
import { useAgent } from "@inngest/use-agent";

export function ChatUI() {
  const { messages, sendMessage, status } = useAgent();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("input") as string;
    if (value.trim()) {
      sendMessage(value);
      e.currentTarget.reset();
    }
  };

  return (
    <div>
      <ul>
        {messages.map(({ id, role, parts }) => (
          <li key={id}>
            <div>{role}</div>
            {parts.map((part) =>
              part.type === "text" ? (
                <div key={part.id}>{part.content}</div>
              ) : null
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={onSubmit}>
        <input name="input" />
        <button type="submit" disabled={status !== "ready"}>
          Send
        </button>
      </form>
    </div>
  );
}
```

### Typed Hook with Client State

```tsx
import { useChatAgent, type ClientState } from "@/hooks/use-chat-agent";

export function AISidebar({ screenId, projectId }: Props) {
  const [input, setInput] = useState("");

  const { messages, status, sendMessage } = useChatAgent({
    channelKey: `screen_${screenId}`,
    state: (): ClientState => ({
      screenId,
      projectId,
      currentFiles: {},
    }),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value || status !== "ready") return;
    setInput("");
    await sendMessage(value);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.map(({ id, role, parts }) => (
          <div key={id} className={role === "user" ? "ml-auto" : ""}>
            {parts.map((part) => {
              if (part.type === "text") {
                return <p key={part.id}>{part.content}</p>;
              }
              if (part.type === "tool-call") {
                return <ToolCallRenderer key={part.toolCallId} part={part} />;
              }
              return null;
            })}
          </div>
        ))}

        {status !== "ready" && <p>AI is thinking...</p>}
      </div>

      <form onSubmit={onSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={status === "ready" ? "Ask anything..." : "Thinking..."}
          disabled={status !== "ready"}
        />
        <button type="submit" disabled={status !== "ready"}>
          Send
        </button>
      </form>
    </div>
  );
}
```

### Tool Call Rendering

```tsx
import type { ToolCallUIPart } from "@inngest/use-agent";
import type { ToolManifest } from "@/types/agent";

function ToolCallRenderer({ part }: { part: ToolCallUIPart<ToolManifest> }) {
  // Show loading state while tool is executing
  if (part.state === "input-streaming" || part.state === "executing") {
    return (
      <div className="p-2 bg-muted rounded">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Running {part.toolName}...</span>
        </div>
        {part.input && (
          <pre className="text-xs mt-2">
            {JSON.stringify(part.input, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  // Show completed tool output
  if (part.state !== "output-available") return null;

  // Type-safe tool output rendering
  if (part.toolName === "generate_code") {
    const { data } = part.output;
    return (
      <div className="p-2 bg-muted rounded">
        <div className="font-medium">Generated Code</div>
        <pre className="text-xs mt-2">{data.code}</pre>
      </div>
    );
  }

  if (part.toolName === "execute_code") {
    const { data } = part.output;
    return (
      <div className="p-2 bg-muted rounded">
        <div className="font-medium">Execution Result</div>
        <pre className="text-xs mt-2">{data.output}</pre>
      </div>
    );
  }

  // Fallback for unknown tools
  return (
    <div className="p-2 bg-muted rounded">
      <div className="font-medium">{part.toolName}</div>
      <pre className="text-xs mt-2">{JSON.stringify(part.output, null, 2)}</pre>
    </div>
  );
}
```

## Event Lifecycle

### Event Flow

1. **Raw Event Streaming**: Message received from Inngest realtime websocket
2. **Mapping**: Transformed into typed `AgentKitEvent`
3. **Dispatch**: Sent to internal `StreamingEngine`
4. **Reduction**: Processed with sequencing/buffering for correct order
5. **State Update**: Creates/updates messages and parts
6. **UI Render**: React re-renders with new state
7. **Callbacks**: `onEvent`, `onStreamEnded`, `onToolResult` fired

### Core Events

| Event                       | Description                    | State Impact                                  |
| --------------------------- | ------------------------------ | --------------------------------------------- |
| `run.started`               | Agent/network execution begins | `runActive: true`, `agentStatus: 'submitted'` |
| `run.completed`             | Agent/network logic finished   | Finalizes in-flight tool outputs              |
| `stream.ended`              | All streaming complete         | `runActive: false`, `agentStatus: 'ready'`    |
| `part.created`              | New message part created       | Adds `TextUIPart` or `ToolCallUIPart`         |
| `text.delta`                | Text chunk streamed            | Appends to `TextUIPart.content`               |
| `part.completed`            | Part finalized                 | Sets status to `complete`                     |
| `tool_call.arguments.delta` | Tool args streaming            | Appends to `ToolCallUIPart.input`             |
| `tool_call.output.delta`    | Tool output streaming          | Appends to `ToolCallUIPart.output`            |

### Tool Call States

```typescript
type ToolCallState =
  | "input-streaming" // Arguments being streamed
  | "input-available" // Arguments complete, ready to execute
  | "executing" // Tool handler running
  | "output-available"; // Execution complete with output
```

## Event Callbacks

### onEvent

Fires for every valid `AgentKitEvent`:

```typescript
useAgent({
  onEvent: (evt, meta) => {
    console.log("Event:", evt.event, "Thread:", meta.threadId);

    if (evt.event === "run.started") {
      showThinkingIndicator();
    }
    if (evt.event === "tool_call.arguments.delta") {
      // Tool is being called
    }
  },
});
```

### onToolResult

Strongly-typed callback when tool completes:

```typescript
useAgent<MyAgentConfig>({
  onToolResult: (result) => {
    if (result.toolName === "generate_code") {
      const codeData = result.data; // Strongly typed!
      // Update preview, save to state, etc.
    }
  },
});
```

### onStreamEnded

Fires when entire turn is complete:

```typescript
useAgent({
  onStreamEnded: ({ threadId }) => {
    console.log(`Agent finished in thread ${threadId}`);
    // Enable input, run analytics, etc.
  },
});
```

## Transport Configuration

### Default Transport (Inngest Realtime)

```typescript
import { AgentProvider, createDefaultAgentTransport } from "@inngest/use-agent";

export function Providers({ children, userId }: Props) {
  const transport = useMemo(
    () =>
      createDefaultAgentTransport({
        api: {
          sendMessage: "/api/chat",
          getRealtimeToken: "/api/realtime/token",
          fetchThreads: "/api/threads",
        },
        headers: () => ({
          Authorization: `Bearer ${getAuthToken()}`,
        }),
      }),
    [userId]
  );

  return (
    <AgentProvider userId={userId} transport={transport}>
      {children}
    </AgentProvider>
  );
}
```

### Custom Transport Override

```typescript
useAgent({
  transport: {
    api: {
      sendMessage: "/api/custom-chat",
      getRealtimeToken: "/api/custom-token",
    },
    headers: () => ({
      "X-Custom-Header": "value",
    }),
    body: (defaultBody) => ({
      ...defaultBody,
      customField: "value",
    }),
  },
});
```

### Session Transport (In-Memory)

For demos or ephemeral chats without persistence:

```typescript
import { createSessionTransport } from "@inngest/use-agent";

const transport = createSessionTransport({
  api: {
    sendMessage: "/api/chat",
    getRealtimeToken: "/api/realtime/token",
  },
});
```

## Multi-Thread Support

```tsx
function MultiThreadChat() {
  const { threads, currentThreadId, setCurrentThread, messages, sendMessage } =
    useAgent({
      threadId: "primary-thread",
      userId: "user-123",
    });

  return (
    <div className="flex">
      <aside className="w-64 border-r">
        {Object.entries(threads).map(([threadId, state]) => (
          <button
            key={threadId}
            onClick={() => setCurrentThread(threadId)}
            className={cn(
              "w-full p-2 text-left",
              threadId === currentThreadId && "bg-accent"
            )}
          >
            {threadId}
            <span className="text-muted-foreground ml-2">
              ({state.messages.length})
            </span>
            {state.hasNewMessages && (
              <span className="ml-2 text-red-500">●</span>
            )}
          </button>
        ))}
      </aside>

      <main className="flex-1">{/* Chat UI */}</main>
    </div>
  );
}
```

## Status States

```typescript
type AgentStatus =
  | "ready" // Idle, ready for input
  | "submitted" // Message sent, waiting for response
  | "streaming" // Receiving response chunks
  | "error"; // Error occurred
```

## Best Practices

1. **Type your tools**: Use `createToolManifest` for end-to-end type safety
2. **Memoize transport**: Use `useMemo` to prevent reconnections
3. **Handle all tool states**: Show loading UI for `input-streaming` and `executing`
4. **Use channelKey**: Scope channels per conversation/screen for isolation
5. **Pass client state**: Include relevant context in `state` callback
6. **Handle errors**: Implement `onError` callback for graceful degradation
7. **Disable input during streaming**: Check `status !== "ready"` before allowing sends

## Debugging

Enable debug mode for detailed logging:

```typescript
useAgent({
  debug: process.env.NODE_ENV === "development",
});
```

Or in provider:

```tsx
<AgentProvider debug={true}>{children}</AgentProvider>
```

## References

- [AgentKit Streaming Overview](https://agentkit.inngest.com/streaming/overview)
- [AgentKit Usage Guide](https://agentkit.inngest.com/streaming/usage-guide)
- [AgentKit Events Reference](https://agentkit.inngest.com/streaming/events)
- [AgentKit Transport](https://agentkit.inngest.com/streaming/transport)
