# AI Workflow Architecture

## Overview

Unit {set} uses Inngest AgentKit with E2B sandboxes to provide AI-powered UI generation. Users can chat with an AI agent that writes and executes Next.js code in isolated sandbox environments with persistent sessions and conversation history.

## Architecture Flow

```
User Message → /api/chat → Inngest Event → AgentKit Network → E2B Sandbox → Convex Update → Response
```

1. User sends message via `AISidebar` component
2. User message saved to Convex `messages` table
3. `/api/chat` validates request and sends Inngest event
4. `runChatAgent` function gets/creates sandbox and runs agent network
5. Agent uses tools to write/read files and execute commands in sandbox
6. Response saved to Convex with files, summary, and sandbox URL
7. UI updates reactively via Convex subscriptions

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
- Gets or creates E2B sandbox with `unitset-sandbox-v1` template
- Supports sandbox reuse via `sandboxId` stored in screen record
- Auto-pause enabled with 15-minute timeout
- Loads previous messages for conversation context
- Runs `chatAgent` in a network with max 15 iterations
- Saves results to Convex: files, summary, sandbox URL, title

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
  filesSummary: string; // Files created/modified summary
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

### Sandbox Lifecycle

- Auto-pause enabled via `Sandbox.betaCreate()` with `autoPause: true`
- 15-minute timeout (`SANDBOX_AUTO_PAUSE_TIMEOUT_MS`)
- Sandbox ID stored in screen record for session persistence
- Automatic resume on reconnect via `Sandbox.connect()`
- Context loss notification if sandbox fails to reconnect

### Sandbox Utilities (`inngest/utils.ts`)

```typescript
// Connect to existing sandbox
export async function getSandbox(sandboxId: string);

// Extract last assistant text message content
export function lastAssistantTextMessageContent(result: AgentResult);

// Format Convex messages for agent context
export function formatMessagesForAgent(messages: ConvexMessage[]): Message[];

// Determine if new sandbox needed
export function shouldCreateNewSandbox(screen: ConvexScreen | null): boolean;

// Parse files_summary from message content
export function parseFilesSummary(content: string): string | null;
```

## Data Model

### Convex Schema

**screens table:**

- `shapeId`: Canvas shape ID (nanoid)
- `projectId`: Parent project reference
- `title`: Screen title (extracted from AI summary)
- `sandboxUrl`: E2B sandbox URL for iframe preview
- `sandboxId`: E2B sandbox ID for session persistence
- `files`: Generated files JSON `{ [path: string]: string }`
- `createdAt`, `updatedAt`: Timestamps

**messages table:**

- `screenId`: Parent screen reference
- `role`: "user" | "assistant"
- `content`: Message content (may include `<files_summary>` tags)
- `createdAt`: Timestamp

### HTTP Endpoints (`convex/http.ts`)

Internal endpoints for Inngest workflow:

| Endpoint                 | Method | Purpose                         |
| ------------------------ | ------ | ------------------------------- |
| `/inngest/updateScreen`  | POST   | Update screen with sandbox data |
| `/inngest/createMessage` | POST   | Create assistant message        |
| `/inngest/getScreen`     | POST   | Get screen with sandboxId       |
| `/inngest/getMessages`   | POST   | Get message history for context |

## API Routes

### POST `/api/chat`

Sends user message to agent:

```typescript
// Request
{ message: string, screenId: string, projectId: string }

// Response
{ success: true, screenId: string, eventId: string }
```

### `/api/inngest`

Inngest webhook handler serving:

- `helloWorld` (test function)
- `runChatAgent` (main chat function)

## UI Integration

### AISidebar Component

Located at `components/canvas/AISidebar.tsx`:

- Three tabs: Chat, Edit (coming soon), Code (coming soon)
- Message history with user/assistant bubbles (reactive via Convex)
- Thinking indicator during processing
- Suggestion chips for quick prompts
- Auto-resize textarea input
- Copy message functionality
- Error retry button
- Credits and timestamp display

### Chat Flow

1. User types message and sends
2. User message saved to Convex via `createMessage` mutation
3. POST to `/api/chat` with message, screenId, projectId
4. Show thinking indicator
5. Inngest workflow processes message
6. Assistant response saved to Convex
7. UI updates reactively via `useQuery(api.messages.getMessages)`

### Message Display

- User messages: Right-aligned bubbles with copy button
- Assistant messages: Left-aligned with logo, credits, timestamp
- `<files_summary>` tags stripped from display but preserved in storage
- Error messages shown with retry option

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

### Validation

Agent must run TypeScript validation before completing:

```bash
./node_modules/.bin/tsc --noEmit
```

### Forbidden Commands

- `npm run dev/build/start`
- `next dev/build/start`

### Final Output Format

```
<task_summary>
Brief description of what was created or changed.
</task_summary>

<files_summary>
List each file created/modified with one-line description.
</files_summary>
```

## Environment Variables

```env
OPENROUTER_API_KEY=sk-or-...  # Required for AI model
E2B_API_KEY=e2b_...           # Required for sandbox (server-side only)
NEXT_PUBLIC_CONVEX_URL=...    # Convex deployment URL
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

# Start Convex dev server (separate terminal)
npx convex dev
```

## Workflow Steps

The `runChatAgent` function executes these steps:

1. **get-screen**: Fetch screen record to check for existing sandbox
2. **get-or-create-sandbox**: Connect to existing or create new sandbox
3. **notify-context-lost**: (conditional) Notify user if sandbox session expired
4. **get-previous-messages**: Load conversation history for context
5. **Run agent network**: Execute AI agent with tools
6. **get-sandbox-url**: Get live preview URL
7. **update-screen-in-convex**: Save files, URL, title to screen record
8. **create-assistant-message**: Save response to messages table
9. **create-error-message**: (on error) Save error message

## Future Enhancements

- [ ] Real-time streaming with `@inngest/realtime`
- [ ] Edit mode for canvas element modification
- [ ] Code generation from designs
- [ ] Multi-agent workflows (reviewer, executor)
- [ ] Human-in-the-loop approval for destructive actions
- [ ] Sandbox file sync on reconnect
- [ ] Message threading and branching
