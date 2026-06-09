# AI Workflow Architecture

## Overview

Unit {set} uses Inngest AgentKit with E2B sandboxes to provide AI-powered UI generation. Users can chat with an AI agent that writes and executes Next.js code in isolated sandbox environments.

## Architecture Flow

```
User Message → /api/chat → Inngest Event → AgentKit Network → E2B Sandbox → Response
```

1. User sends message via `AISidebar` component
2. `/api/chat` validates request and sends Inngest event
3. `runChatAgent` function creates sandbox and runs agent network
4. Agent uses tools to write/read files and execute commands in sandbox
5. Response includes generated files, summary, and live preview URL

## Core Components

### Inngest Client (`inngest/client.ts`)

```typescript
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "unit-set",
  isDev: process.env.NODE_ENV === "development",
});
```

### Agent Function (`inngest/functions.ts`)

The `runChatAgent` function orchestrates the AI workflow:

- Event: `chat/message.sent`
- Creates E2B sandbox with `unitset-sandbox-v1` template
- Runs `chatAgent` in a network with max 15 iterations
- Returns: `{ threadId, files, summary, url }`

### UI Coding Agent

Expert Next.js UI developer with these tools:

| Tool                  | Purpose                                               |
| --------------------- | ----------------------------------------------------- |
| `terminal`            | Execute shell commands (install packages, list files) |
| `createOrUpdateFiles` | Write files to sandbox (relative paths only)          |
| `readFiles`           | Read file contents (no @ alias in paths)              |

### Agent State

```typescript
interface AgentState {
  summary: string; // Task completion summary
  files: { [path: string]: string }; // Generated files
}
```

### Network Router

Simple state-based routing:

- Continues until agent produces `<task_summary>` in response
- Max 15 iterations to prevent infinite loops

## E2B Sandbox

### Template: `unitset-sandbox-v1`

Pre-configured Next.js 15.3.3 environment with:

- shadcn/ui components (all installed)
- Tailwind CSS + PostCSS
- Dev server running on port 3000 with Turbopack
- Hot reload enabled

### Sandbox Utilities (`inngest/utils.ts`)

```typescript
// Connect to existing sandbox
export async function getSandbox(sandboxId: string) {
  return await Sandbox.connect(sandboxId);
}

// Extract last assistant message
export function lastAssistantTextMessageContent(result: AgentResult) {
  // Returns text content from last assistant message
}
```

## API Routes

### POST `/api/chat`

Sends user message to agent:

```typescript
// Request
{ message: string, threadId?: string }

// Response
{ success: true, threadId: string, eventId: string }
```

### GET `/api/chat/test`

Health check endpoint.

### `/api/inngest`

Inngest webhook handler serving:

- `helloWorld` (test function)
- `runChatAgent` (main chat function)

## UI Integration

### AISidebar Component

Located at `components/canvas/AISidebar.tsx`:

- Three tabs: Chat, Edit (coming soon), Code (coming soon)
- Message history with user/assistant bubbles
- Thinking indicator during processing
- Suggestion chips for quick prompts
- Auto-resize textarea input

### Chat Flow

1. User types message and sends
2. POST to `/api/chat` with message and threadId
3. Show thinking indicator
4. Poll for response (currently placeholder)
5. Display assistant response

## Agent System Prompt Rules

The agent follows strict guidelines:

### File Paths

- `createOrUpdateFiles`: Always relative (e.g., `app/page.tsx`)
- `readFiles`: Actual paths without `@` alias
- Imports in code: Use `@/` alias

### Client Components

- Add `"use client"` as first line for hooks/browser APIs

### Styling

- Tailwind CSS only (no CSS/SCSS files)
- Use semantic theme colors
- Dark mode first

### shadcn/ui

- Import from individual paths: `@/components/ui/button`
- Never group-import from `@/components/ui`
- Import `cn()` from `@/lib/utils`

### Forbidden Commands

- `npm run dev/build/start`
- `next dev/build/start`

## Environment Variables

```env
OPENROUTER_API_KEY=sk-or-...  # Required for AI model
E2B_API_KEY=e2b_...           # Required for sandbox (in functions)
```

## Model Configuration

Using OpenRouter with OpenAI-compatible API:

```typescript
const openrouter = (config: { model: string }) =>
  openai({
    model: config.model,
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: "https://openrouter.ai/api/v1",
  });

// Current model
model: openrouter({ model: "x-ai/grok-4.1-fast:free" });
```

## Local Development

```bash
# Start Inngest dev server
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest

# Start Next.js app
pnpm dev
```

## Future Enhancements

- [ ] Real-time streaming with `@inngest/realtime`
- [ ] Thread persistence with history adapter
- [ ] Edit mode for canvas element modification
- [ ] Code generation from designs
- [ ] Multi-agent workflows (reviewer, executor)
- [ ] Human-in-the-loop approval for destructive actions
