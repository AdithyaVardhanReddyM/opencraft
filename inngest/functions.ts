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
  extractRoute,
  deriveRouteFromFiles,
  buildActiveAnchor,
  buildRepoMap,
  parseChanges,
  type ConvexScreen,
  type ConvexMessage,
  type FileMeta,
} from "./utils";
import z from "zod";

interface AgentState {
  summary: string;
  filesSummary: string;
  title: string;
  route: string; // Route the agent built (flow pages); empty for normal builds
  files: { [path: string]: string };
  reasoningDetails?: unknown; // For reasoning models that require reasoning token storage
}

// OpenRouter provider using OpenAI-compatible API
// For reasoning models, we use a proxy that adds the reasoning parameter and
// preserves reasoning_details across tool calls (required by OpenRouter)
const openrouter = (config: { model: string; reasoning?: boolean }) => {
  const needsReasoning = requiresReasoningTokens(config.model);

  // Use proxy for reasoning models, direct OpenRouter for others
  const baseUrl = needsReasoning
    ? `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/openrouter-proxy`
    : "https://openrouter.ai/api/v1";

  // Per-request reasoning preference (default OFF). For proxy-routed reasoning
  // models we encode "reasoning off" as a ":noreason" model suffix the proxy reads
  // and strips before calling OpenRouter — the only channel we have from here to
  // the proxy (AgentKit owns the outgoing request body).
  const model =
    needsReasoning && !config.reasoning
      ? `${config.model}:noreason`
      : config.model;

  return openai({
    model,
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl,
  });
};

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

// Extract title from explicit <title> tag or fall back to task summary
const extractTitle = (content: string): string => {
  // First, try to extract from explicit <title> tag
  const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]?.trim()) {
    const title = titleMatch[1].trim();
    return title.length > 50 ? title.substring(0, 47) + "..." : title;
  }

  // Fall back to extracting from task_summary
  const cleanSummary = content
    .replace(/<task_summary>/gi, "")
    .replace(/<\/task_summary>/gi, "")
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<files_summary>[\s\S]*?<\/files_summary>/gi, "")
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

// Default model ID - Google Gemini 3.5 Flash (fast; reasoning capped to low effort
// in the OpenRouter proxy). Kimi-K2.7's slow non-streaming reasoning made simple
// builds take minutes; Flash returns far quicker.
const DEFAULT_MODEL_ID = "google/gemini-3.5-flash";

// Models that require reasoning token storage (reasoning_details must be
// preserved across tool calls per OpenRouter docs). All current models are
// reasoning-capable, so all route through the reasoning proxy.
const REASONING_MODELS = [
  "google/gemini-3.5-flash",
  "anthropic/claude-sonnet-4.6",
];

/**
 * Check if a model requires reasoning token storage
 */
function requiresReasoningTokens(modelId: string): boolean {
  return REASONING_MODELS.some((m) => modelId.includes(m));
}

/**
 * Send a server-side track event to Pendo
 */
async function trackPendoEvent(
  event: string,
  visitorId: string,
  properties: Record<string, unknown> = {}
) {
  try {
    await fetch("https://data.pendo.io/data/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pendo-integration-key": "650460f8-9d7d-48e5-bb97-7ee1e1ed158b",
      },
      body: JSON.stringify({
        type: "track",
        event,
        visitorId,
        accountId: "system",
        timestamp: Date.now(),
        properties,
      }),
    });
  } catch (e) {
    console.error("[Pendo] Failed to track event:", event, e);
  }
}

// --- Conditional system-prompt capability blocks ---------------------------
// These large blocks are only relevant to SOME builds. The agent runs one
// inference per tool call, so re-sending an irrelevant block on every call is
// pure latency. We keep them out of the core prompt and append only the ones a
// given request actually needs (see the detection in runChatAgent).

const IMAGE_GUIDANCE = `

## Images
- For any photographic content (hero/banner, gallery, card thumbnails, blog covers, backgrounds, product shots, team/testimonial photos) use REAL stock images that are RELEVANT to the page's subject. A skincare site shows skincare/beauty photos; a coffee shop shows coffee; a SaaS dashboard shows workspaces/people working. Random or unrelated images are NOT acceptable — relevance matters as much as quality.
- NEVER hand-author SVG illustrations, inline data-URI graphics, "abstract art", or gradient/solid-color placeholder divs as a substitute for a real photo. This is the #1 thing to avoid.
- Render stock images with a plain \`<img>\` tag, NOT \`next/image\`. This sidesteps all Next.js image-domain/config errors and works regardless of host. Always set explicit dimensions (width/height attributes or a fixed aspect-ratio + \`object-cover\` class) so layout never shifts, and a short descriptive \`alt\`.
- How to pick RELEVANT photos — search the **Pexels API at GENERATION TIME** with the \`terminal\` tool, then hardcode the returned URLs:
  - Do this EARLY and in BULK: run just **1–2 broad searches total** for the whole page with a high \`per_page\` so one call returns enough photos for every section. ONE search of 15 results usually covers a full landing page (hero + cards + gallery). Do NOT run a separate curl per image — that wastes your limited step budget and risks not finishing the page.
    \`curl -s -H "Authorization: 3Wk3ZtcPCSiQxXZNJ2ZeX2xtSmXJeeNqjyUqfFo1nsrb06f7klZJGn06" "https://api.pexels.com/v1/search?query=<url-encoded keywords>&per_page=15&orientation=landscape"\`
    - Use SPECIFIC keywords drawn from the page subject. Examples: \`skincare%20serum\`, \`face%20cream%20cosmetics\`, \`coffee%20latte\`, \`team%20meeting%20office\`. For tall/profile images use \`orientation=portrait\`; for square-ish use \`orientation=square\`.
    - The response is JSON: \`{ "photos": [ { "src": { "original", "large2x", "large", "medium", "small", "landscape", "portrait", "tiny" }, "alt": "…" }, … ] }\`. Take the URLs from \`photos[].src\` — use \`src.large\` (or \`src.landscape\` for wide heroes, \`src.medium\`/\`src.small\` for cards/thumbnails). They look like \`https://images.pexels.com/photos/<id>/...jpeg?...\`.
    - To list candidate URLs quickly you can pipe it: \`curl -s -H "Authorization: <key>" "https://api.pexels.com/v1/search?query=skincare%20serum&per_page=15" | grep -o '"large":"[^"]*"'\`.
    - Assign a DIFFERENT photo from the returned list to each image slot so nothing repeats, and use the EXACT URLs returned by the API in your \`<img>\` tags. Also use each photo's \`alt\` text from the response for the \`<img alt>\`.
  - CRITICAL: Pexels is for YOUR generation-time search only. Do NOT call the Pexels API (or put the API key) anywhere in the generated app code — bake the resolved \`images.pexels.com\` URLs in as static \`<img src>\` values. The final app must make no external API calls.
  - If a Pexels search fails or returns nothing usable, fall back to keyword-matched LoremFlickr (always resolves): \`https://loremflickr.com/<width>/<height>/<comma-separated-keywords>?lock=<n>\` (different \`lock\` per image).
  - **Avatars / profile pictures:** prefer Pexels portrait results; otherwise \`https://i.pravatar.cc/<size>?img=<1-70>\` (real faces) or \`https://api.dicebear.com/9.x/avataaars/svg?seed=<name>\` (illustrated).
  - **Abstract/decorative backgrounds ONLY (where the subject genuinely doesn't matter):** \`https://picsum.photos/seed/<seed>/<width>/<height>\`. Do NOT use Picsum for content images — it returns photos unrelated to your topic (this is exactly what makes a page look wrong).
  - **Labeled placeholder (only when no photo fits, e.g. a logo slot):** \`https://placehold.co/<width>x<height>?text=<label>\`.
- Match the requested image size to the rendered box (e.g. a 3-column card grid → ~600x400 per card) so images stay crisp and load fast.
- Icons remain Lucide React components — do not fetch icon images.`;

const WEBPAGE_GUIDANCE = `

## Webpage Recreation (scrapeWebpage)

When the user provides a URL and asks to recreate, clone, redesign, or take inspiration from that page:

1. **Call \`scrapeWebpage\` FIRST** with the URL, before writing any code. Build only after you have the scraped context.
2. **Recreate structure from the returned HTML** — match the section layout, hierarchy, and ordering (navbar, hero, features, pricing, footer, etc.).
3. **Use the copy from the returned markdown** — reuse the page's actual headings and text content, not lorem ipsum.
4. **Match the styling exactly** — derive colors, fonts, sizes, and spacing from the HTML's class names and inline \`style\` attributes. DO NOT convert to the theme system. Use arbitrary Tailwind values like \`bg-[#0a0a0a]\`, \`text-[15px]\`, \`font-[Inter]\` to match precisely, unless the user explicitly asks to adapt it to the theme.
5. **Images:** keep external image URLs found in the scraped HTML as-is. If a scraped image fails to load, fall back to a same-size Lorem Picsum image (\`https://picsum.photos/seed/<seed>/<w>/<h>\`) rather than a blank placeholder div.
6. If \`scrapeWebpage\` returns an error (e.g. out of credits, rate limited, bad URL), tell the user what happened and ask how to proceed — do not fabricate the page from memory.
7. **Stay step-efficient.** Recreation is large, so batch your work: write multiple files in a single \`createOrUpdateFiles\` call and avoid unnecessary re-reads. You MUST still finish with the \`<task_summary>\` block (after validation passes) exactly as described in "Final Output" — never stop after building without emitting it, even for big pages.

The goal is a faithful, high-fidelity recreation of the real page — close to exact replication, not a loose theme-adapted interpretation.`;

const CAPTURE_GUIDANCE = `

## Captured Element Replication

When a user sends a message containing \`[UNITSET_ELEMENT_CAPTURE]\` tags, they are providing HTML and CSS captured from a real webpage component they want you to replicate.

### Recognition
The captured data includes:
- **HTML**: The complete outer HTML structure of the element
- **Computed Styles**: All CSS styles as computed by the browser (actual pixel values, colors, etc.)
- **Metadata**: Element tag name, dimensions, and position

### Replication Guidelines — EXACT MATCH PRIORITY
**IMPORTANT**: For captured elements, your goal is to replicate the component as EXACTLY as possible. This is different from normal requests where you use the theme system.

1. **Use EXACT colors from the captured styles** — DO NOT convert to theme colors
   - If the captured style shows \`background-color: rgb(59, 130, 246)\`, use \`bg-[#3b82f6]\` or the exact Tailwind color
   - Preserve gradients, shadows, and opacity values exactly as captured
   - Only use theme colors (bg-primary, etc.) if the user explicitly asks to adapt to the theme

2. **Preserve exact dimensions and spacing**
   - Use arbitrary values like \`w-[320px]\`, \`p-[18px]\` when needed for exact match
   - Don't round to Tailwind scale if it changes the appearance

3. **Handle images and assets**
   - If the HTML contains \`<img>\` tags with external URLs, keep them as-is
   - For background images, preserve the exact URL
   - If images fail to load, use a placeholder div with the same dimensions

4. **Analyze the HTML structure** and recreate it using React components
   - Match the exact nesting and element structure
   - Preserve class names as comments for reference

5. **Use shadcn/ui components** only when they match the captured pattern exactly
   - If the captured button looks different from shadcn Button, build a custom one

6. **Preserve ALL visual details**
   - Border radius, shadows, transitions
   - Font sizes, weights, line heights
   - Hover states if visible in styles

7. **Make it functional** — add appropriate click handlers and state

### Output
Create a React component that is a PIXEL-PERFECT replica of the captured element. The goal is exact visual replication, not adaptation to the design system.`;

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
      modelId: eventModelId,
      imageUrls: eventImageUrls,
      clerkId,
    } = event.data;

    // Extract message content - prefer userMessage.content, fall back to legacy message
    const message = userMessage?.content || legacyMessage;

    // Extract modelId and imageUrls from state or event data
    const stateModelId = userMessage?.state?.modelId as string | undefined;
    const stateImageUrls = userMessage?.state?.imageUrls as
      | string[]
      | undefined;
    const modelId = stateModelId || eventModelId || DEFAULT_MODEL_ID;
    const imageUrls = stateImageUrls || eventImageUrls || [];

    // Per-request reasoning toggle (default OFF). Reasoning slows builds down, so
    // it's opt-in from the UI switch; threaded to the proxy via openrouter().
    const reasoningEnabled = userMessage?.state?.reasoningEnabled === true;

    // Step 0: Check generation limit before proceeding
    if (clerkId) {
      const canGenerateResult = await step.run(
        "check-generation-limit",
        async () => {
          const convexHttpUrl = getConvexHttpUrl();
          const response = await fetch(`${convexHttpUrl}/inngest/canGenerate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clerkId }),
          });
          if (!response.ok) {
            return { canGenerate: true }; // Allow on error to not block users
          }
          return (await response.json()) as {
            canGenerate: boolean;
            reason?: string;
            remaining?: number;
          };
        }
      );

      if (!canGenerateResult.canGenerate) {
        // Create error message and return early
        if (screenId) {
          await step.run("create-limit-reached-message", async () => {
            const convexHttpUrl = getConvexHttpUrl();
            await fetch(`${convexHttpUrl}/inngest/createMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                screenId,
                role: "assistant",
                content:
                  "You've reached your generation limit of 10. Thank you for trying OpenCraft! Stay tuned for more updates.",
              }),
            });
          });
        }
        await step.run("track-pendo-limit-reached", async () => {
          await trackPendoEvent("generation_limit_reached", clerkId, {
            screen_id: screenId,
            project_id: projectId,
          });
        });

        return {
          screenId,
          projectId,
          isError: true,
          errorType: "GENERATION_LIMIT_REACHED",
        };
      }
    }

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

    // Flow build: this screen is a "flow child" that adds a new page/route to its
    // parent's app inside the SAME sandbox. Seed file context from the parent (the
    // child's own files are empty initially) and instruct the agent to build a new
    // route instead of overwriting the home page.
    const isFlowBuild = !!screen?.parentScreenId;

    const parentScreen = isFlowBuild
      ? await step.run("get-parent-screen", async () => {
          const convexHttpUrl = getConvexHttpUrl();
          const response = await fetch(`${convexHttpUrl}/inngest/getScreen`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ screenId: screen!.parentScreenId }),
          });
          if (!response.ok) {
            return null;
          }
          return (await response.json()) as ConvexScreen | null;
        })
      : null;

    // Seed the agent's known files from the parent for flow builds so it reuses the
    // existing codebase/components; normal builds use the screen's own files.
    const seedFiles =
      isFlowBuild && parentScreen?.files
        ? parentScreen.files
        : screen?.files || {};

    // Extra system guidance appended only for flow builds.
    const flowSystemAddendum = isFlowBuild
      ? `

## Flow Page (IMPORTANT — this is a new page in an EXISTING app)
You are adding a NEW page to an existing Next.js app that already has pages, components, theme, and design tokens in place from earlier work in this same sandbox.

- Create the page at a NEW route — e.g. \`app/checkout/page.tsx\` serves "/checkout". Pick a short, sensible route slug from the user's request.
- DO NOT modify or overwrite \`app/page.tsx\` or any other existing page. Only add the new route's files (plus genuinely-new shared components if truly needed).
- REUSE the existing components, layout primitives, and theme for visual consistency. The design system is already established — you do NOT need to read the whole codebase. Read at most one or two key files only if you need a specific pattern, then build.
- STAY STEP-EFFICIENT: batch your work into as few \`createOrUpdateFiles\` calls as possible and avoid unnecessary re-reads so you reach the final output well within the step budget.
- During validation, ONLY fix errors in files you created or edited. Do NOT attempt to fix pre-existing errors in files you did not touch.
- You MUST still finish with the full output block from "Final Output" (<title>, <task_summary>, <files_summary>). IN ADDITION, include the exact route you created:

<route>
/your-new-route
</route>`
      : "";

    // Create state with previous messages for agent context
    const state = createState<AgentState>(
      {
        summary: "",
        filesSummary: "",
        title: "",
        route: "",
        files: seedFiles,
        reasoningDetails: undefined, // Will be populated for reasoning model responses
      },
      { messages: previousMessages }
    );

    // Counts agent turns that produced readable reasoning, so the UI can order
    // the live "thinking" stream across the run's multiple inferences.
    let reasoningTurn = 0;

    // Latency instrumentation: count inferences and time each one so the dev log
    // shows whether a slow run is "a few very slow inferences" or "too many", and
    // exactly which tools (if any) each inference called. This is what tells us if
    // the agent is stuck thinking vs. actually building.
    let inferenceCount = 0;
    let lastInferenceAt = Date.now();
    const runStartedAt = Date.now();

    // Conditional system-prompt assembly: detect what THIS request actually needs
    // so we only append the heavy capability blocks (image sourcing, webpage
    // recreation, element capture) when relevant. Re-sending all of them on every
    // one of the run's many inferences is pure latency — a simple build ("a
    // calculator") needs none of them.
    const msgText = message || "";
    const hasCapture = /\[UNITSET_ELEMENT_CAPTURE\]/i.test(msgText);
    const hasUrl = /https?:\/\/\S+/i.test(msgText);
    // Utility/tool UIs rarely need photography; recreation and element-capture
    // supply their own imagery. Otherwise bias toward including image guidance.
    const utilityOnly =
      /\b(calculator|to-?do|todo|timer|stopwatch|countdown|converter|dashboard|admin|data table|spreadsheet|kanban|settings|sign[- ]?in|login|chat app|calendar|clock|weather|crud)\b/i.test(
        msgText
      );
    const mentionsImagery =
      /\b(image|photo|picture|gallery|hero|banner|avatar|thumbnail|cover|background|stock photo|portrait|illustration)\b/i.test(
        msgText
      );
    const needsImages =
      !hasCapture && !hasUrl && (!utilityOnly || mentionsImagery);

    const imageAddendum = needsImages ? IMAGE_GUIDANCE : "";
    const webpageAddendum = hasUrl ? WEBPAGE_GUIDANCE : "";
    const captureAddendum = hasCapture ? CAPTURE_GUIDANCE : "";

    console.log(
      `[runChatAgent] prompt blocks → images:${needsImages} webpage:${hasUrl} capture:${hasCapture} (flow:${isFlowBuild})`
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
- Tailwind CSS **v4** and PostCSS preconfigured (CSS-first config — there is NO tailwind.config.js/ts; do NOT create one)
- shadcn/ui components in @/components/ui (radix-ui, lucide-react, class-variance-authority, tailwind-merge pre-installed)
- Theme system with CSS variables in globals.css — colors may change based on user's selected theme

## Tools

You receive a complete **repo map** (every file as \`path — one-liner\`) plus an **active-screen anchor** at the top of each turn. Trust them as the current state of the project — do NOT run \`ls\`/\`cat\` or otherwise re-discover the file list. Read a file only when you're about to edit it.

### 1. terminal
Execute shell commands in the sandbox (package installs, validation).
- Install packages: \`npm install <package> --yes\`
- Validate: \`./node_modules/.bin/tsc --noEmit\`
- NEVER run: npm run dev, npm run build, npm run start, next dev, next build, next start
- Do NOT use it just to \`ls\`/\`cat\` the project — the repo map already lists every file.

### 2. createOrUpdateFiles
Write COMPLETE files. Use this for NEW files (or a genuine full rewrite). To modify an existing file, prefer editFile.
- Paths MUST be relative (e.g., "app/page.tsx", "lib/utils.ts")
- NEVER use absolute paths like "/home/user/..."
- Can batch multiple files in one call

### 3. editFile
Make targeted search-and-replace edits to an EXISTING file without rewriting it. This is the DEFAULT for follow-up edits — it is far cheaper than re-emitting the whole file.
- Read the file first (or rely on having just written it), then replace exact strings.
- oldString must match byte-for-byte (including indentation) and be unique, unless replaceAll is true.
- On "not found" / "not unique", re-read the file, add surrounding context to disambiguate, and retry.

### 4. readFiles
Read file contents on demand.
- Use actual paths (e.g., "app/page.tsx", "components/ui/button.tsx")
- NEVER use "@" alias in file paths — it will fail
- Read a file before you editFile it (unless you just wrote it). Guided by the repo map's ▸ markers + the active-screen anchor, this is usually ONE precise read.

### 5. searchProject
Grep/regex across the project — returns \`path:line — snippet\` for a symbol, className, import, or string WITHOUT reading whole files.
- Use it to locate code before reading/editing (e.g. "where is the theme defined", "which files import Hero", "where is this color used").
- Optionally scope to a directory (e.g. "components").

### 6. scrapeWebpage
Fetch a live webpage and get its HTML structure, design tokens (colors/fonts/spacing), markdown content, and links as text context.
- ONLY use when the user provides a URL AND asks to recreate / clone / redesign / take inspiration from that specific page
- Do NOT use it for generic build requests that don't reference a real URL
- See "Webpage Recreation" below for how to use the returned context

## Critical Rules

### File Paths
- createOrUpdateFiles: ALWAYS relative paths (e.g., "app/page.tsx")
- readFiles: ALWAYS actual paths without "@" alias
- Imports in code: Use "@/" alias (e.g., import { Button } from "@/components/ui/button")
- NEVER include "/home/user" in any path

### Client Components
- Add "use client" as THE FIRST LINE for any file using React hooks or browser APIs
- This includes app/page.tsx if it uses useState, useEffect, etc.

### Styling — IMPORTANT
- Use ONLY Tailwind CSS classes — never create .css, .scss, or .sass files
- **ALWAYS use semantic theme colors from globals.css** unless the user explicitly requests specific colors:
  - Backgrounds: bg-background, bg-card, bg-popover, bg-primary, bg-secondary, bg-muted, bg-accent, bg-destructive
  - Text: text-foreground, text-card-foreground, text-popover-foreground, text-primary-foreground, text-secondary-foreground, text-muted-foreground, text-accent-foreground, text-destructive-foreground
  - Borders: border-border, border-input, border-ring
  - Charts: bg-chart-1 through bg-chart-5
  - Sidebar: bg-sidebar, text-sidebar-foreground, bg-sidebar-accent, text-sidebar-accent-foreground
- These semantic colors automatically adapt to the user's selected theme (Claude, Vercel, Cyberpunk, etc.)
- Only use hardcoded colors (like bg-blue-500, text-red-600) when the user explicitly requests a specific color
- Avoid multi-color gradients; prefer single-color opacity variations (e.g., bg-primary/10)
- Dark mode first (default theme)
- **Tailwind v4 specifics** (this project is on Tailwind v4, NOT v3):
  - There is NO \`tailwind.config.js/ts\`. NEVER create one — a config file with a \`theme.extend\` block is silently ignored in v4 and your custom colors/fonts will not apply.
  - To add a NEW custom theme token, define it as a CSS variable in \`app/globals.css\` inside the existing \`:root\`/\`.dark\` blocks AND map it under \`@theme inline\` (e.g. \`--color-brand: var(--brand);\`) — then \`bg-brand\` works. Prefer the existing semantic tokens above; only add new ones when genuinely needed.
  - Use v4 utility names: \`shadow-xs\`/\`shadow-sm\` (the scale shifted), \`rounded-xs\`, \`outline-hidden\` (not \`outline-none\` for the hidden case), and opacity via the slash syntax (\`bg-black/50\`, not \`bg-opacity-50\`). The default \`ring\` is 1px — use \`ring-2\`/\`ring-3\` for a thicker ring.
  - Dark mode is class-based via the \`.dark\` selector (already wired in globals.css) — use \`dark:\` variants as normal.

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

### Design Principles — make it distinctive, not templated
Approach each build like a design lead giving THIS specific subject a visual identity that couldn't be mistaken for any other app. Make deliberate, opinionated choices grounded in the subject's world — avoid the generic "AI default" looks (cream + serif + terracotta; near-black with one acid accent; broadsheet hairlines) unless the brief explicitly asks for them.
- **Ground it in the subject.** Decide (to yourself) the subject, its audience, and the page's single job, then derive layout, type, imagery, and copy from that — not from a generic skeleton. Use realistic, specific content, never lorem ipsum.
- **The hero is a thesis.** Open with the most characteristic thing in the subject's world (a strong headline, a key visual, a live/interactive moment). The "big number + label + gradient accent" hero is the template answer — only use it if it is genuinely the best choice.
- **Typography carries the personality.** Set a clear type scale with intentional sizes, weights, and spacing, and pair a characterful display treatment (used with restraint) with a clean body face. You may load fonts via \`next/font/google\` or a Google Fonts \`<link>\` in \`app/layout.tsx\`. Make the type itself memorable, not a neutral delivery vehicle.
- **Structure encodes meaning.** Eyebrows, dividers, numbering, and section labels should reflect something true about the content. Don't add 01 / 02 / 03 markers unless the content is genuinely an ordered sequence.
- **Motion, deliberately.** One orchestrated moment (a load reveal, a scroll-triggered transition, a hover micro-interaction) lands harder than scattered effects. Over-animation reads as AI-generated — keep it purposeful and respect \`prefers-reduced-motion\`.
- **Spend boldness in ONE place.** Choose a single signature element to be the memorable thing and keep everything around it quiet and disciplined; cut decoration that doesn't serve the brief. Match execution to the vision — maximalist needs elaborate detail, minimal needs precise spacing and type.
- **Distinctiveness within the theme.** Use the semantic theme tokens (bg-background, bg-primary, text-foreground, …) so the result adapts to the user's selected theme; express identity through composition, type, hierarchy, spacing, and the signature element rather than clashing hardcoded colors. Only hardcode colors when the user asks, or add a new theme token (per the Tailwind v4 rule above) when the design genuinely needs an accent.
- **Copy is design material.** Write from the user's side of the screen: active voice, sentence case, specific over clever. A button says what happens ("Save changes", not "Submit") and keeps that name through the whole flow; error and empty states give direction, not mood.
- **Quality floor (non-negotiable):** responsive down to mobile, visible keyboard focus, accessible contrast, Lucide React icons, consistent Tailwind spacing. Build complete, real layouts — no stubs or placeholders.
- **Self-critique before finishing.** Ask whether the result reads like the generic default you'd produce for any similar prompt; if so, revise the part that's generic. Like Chanel's rule, remove one decorative accessory before you call it done.
- If you need an incidental photo and no detailed image guidance appears below, use a REAL stock image in a plain \`<img>\` with explicit dimensions (e.g. a Pexels or LoremFlickr URL) — never fake it with an SVG or gradient div.

### Layout Requirements
- Build complete layouts: navbar, sidebar, footer, content sections
- Implement realistic behavior and interactivity
- Use static/local data only (no external APIs)

## Workflow
1. Think step-by-step before coding
2. Use the repo map + active-screen anchor to find the right file; use readFiles/searchProject only when you actually need a file's contents (don't ls/cat to re-discover what the map already lists)
3. Check shadcn component APIs before using
4. Write production-quality code
5. createOrUpdateFiles for NEW files; editFile for changes to EXISTING files
6. Use terminal for package installation and validation

## Validation (REQUIRED)
After writing code in the files, you MUST run this validation command:
\`./node_modules/.bin/tsc --noEmit\`

This catches:
- TypeScript + import errors (tsc --noEmit)
- **"Cannot find module" / "Module not found" errors** — every component or file you \`import\` MUST actually be created. This is the most common failure: \`app/page.tsx\` imports \`@/components/foo\` but \`components/foo.tsx\` was never written. Before validating, double-check that EVERY import in every file you wrote points to a file that exists (a shadcn/ui component, an npm package, or a file you created this run).

If validation fails:
1. Read the error output carefully
2. Fix ALL errors in your code (create any missing files; correct any wrong import paths)
3. Re-run the validation command

DO NOT output the task_summary until the validation passes successfully. Emitting task_summary ENDS the run immediately — if you emit it while imports are still unresolved, the app ships broken with a "Module not found" build error. Never declare done with a missing file.

## Final Output
After ALL tool calls complete AND validation passes, respond with ONLY:

<title>
A short, descriptive title for this app/project (2-5 words, e.g., "Task Manager Dashboard", "E-commerce Landing Page")
</title>

<task_summary>
A short, human-readable summary of what you did this turn — 1-3 sentences of plain prose (NO headings or bullet lists). This is shown in chat and replayed as conversation history every turn, so keep it tight. Examples: "Built a SaaS landing page with a hero, feature grid, pricing, and footer." / "Made the hero headline larger and added a 'Watch demo' button that opens a video modal."
</task_summary>

<files_summary>
List EVERY file you created, updated, or deleted this turn, one per line as \`path: one-line description\`. For a deletion write \`deleted path\`. This list maintains the project's file map for future turns, so be complete and accurate (it is not shown to the user):
- app/page.tsx: landing page with hero, features, pricing, footer
- components/video-modal.tsx: demo video dialog (props: open, onClose)
- deleted components/old-hero.tsx
</files_summary>

Do not include these tags until the task is 100% complete and validation has passed.

${imageAddendum}${webpageAddendum}${captureAddendum}${flowSystemAddendum}`,
      model: openrouter({ model: modelId, reasoning: reasoningEnabled }),
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
            // Get current files from state before the step
            const currentFiles = { ...(network.state.data.files || {}) };

            // Write each file independently so one failure can't discard the
            // whole batch: record every success and report exactly which files
            // failed, so the agent retries only those instead of assuming none
            // were written (which previously left imports pointing at files that
            // were actually on disk, or silently dropped a whole batch).
            const result = await step?.run("createorUpdateFiles", async () => {
              let sandbox;
              try {
                sandbox = await getSandbox(sandboxId);
              } catch (error) {
                return {
                  files: {} as Record<string, string>,
                  failed: files.map((f) => ({
                    path: f.path,
                    error: String(error),
                  })),
                };
              }
              const writtenFiles: Record<string, string> = {};
              const failed: { path: string; error: string }[] = [];
              for (const file of files) {
                try {
                  await sandbox.files.write(file.path, file.content);
                  writtenFiles[file.path] = file.content;
                } catch (error) {
                  failed.push({ path: file.path, error: String(error) });
                }
              }
              return { files: writtenFiles, failed };
            });

            // Merge whatever was written into state, then surface any failures.
            if (result && typeof result === "object" && "files" in result) {
              const writtenFiles = result.files as Record<string, string>;
              network.state.data.files = {
                ...currentFiles,
                ...writtenFiles,
              };
              const failed =
                (result.failed as { path: string; error: string }[]) || [];
              const wrote = Object.keys(writtenFiles);
              const okMsg = `Successfully wrote ${wrote.length} file(s): ${wrote.join(
                ", "
              )}`;
              if (failed.length > 0) {
                return `${okMsg}. FAILED to write ${
                  failed.length
                } file(s) — you MUST retry these: ${failed
                  .map((f) => `${f.path} (${f.error})`)
                  .join("; ")}`;
              }
              return okMsg;
            }
            return "Unknown error occurred";
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
        createTool({
          name: "editFile",
          description:
            "Make targeted search-and-replace edits to an EXISTING file without rewriting it. This is the preferred way to modify a file you've already created or read — it saves tokens and time versus re-emitting the whole file with createOrUpdateFiles. Each oldString must match the file exactly (including whitespace/indentation) and be unique, unless replaceAll is true.",
          parameters: z.object({
            path: z
              .string()
              .describe(
                "The file path relative to project root (e.g., 'app/page.tsx')"
              ),
            edits: z
              .array(
                z.object({
                  oldString: z
                    .string()
                    .describe(
                      "Exact text to find — must be unique in the file unless replaceAll is true"
                    ),
                  newString: z
                    .string()
                    .describe("Replacement text (use \"\" to delete)"),
                  replaceAll: z
                    .boolean()
                    .optional()
                    .describe("Replace every occurrence (default false)"),
                })
              )
              .describe("One or more search-replace edits, applied in order"),
          }),
          handler: async (
            { path, edits },
            { step, network }: Tool.Options<AgentState>
          ) => {
            const currentFiles = { ...(network.state.data.files || {}) };

            const result = await step?.run("editFile", async () => {
              let sandbox;
              try {
                sandbox = await getSandbox(sandboxId);
              } catch (error) {
                return {
                  ok: false as const,
                  error: `Could not connect to sandbox: ${String(error)}`,
                };
              }

              let content: string;
              try {
                content = await sandbox.files.read(path);
              } catch (error) {
                return {
                  ok: false as const,
                  error: `Could not read "${path}". Use createOrUpdateFiles to create a NEW file; editFile only modifies existing ones. (${String(
                    error
                  )})`,
                };
              }

              // Apply edits sequentially. Fail the WHOLE call on the first bad
              // edit so the file is never left half-applied — the agent re-reads
              // and retries. split().join() does literal replacement (no regex /
              // "$&" footguns) and, because we require uniqueness unless
              // replaceAll, replaces exactly the intended occurrence(s).
              for (let i = 0; i < edits.length; i++) {
                const { oldString, newString, replaceAll } = edits[i];
                if (oldString === newString) {
                  return {
                    ok: false as const,
                    error: `Edit ${i + 1}: oldString and newString are identical.`,
                  };
                }
                const count = content.split(oldString).length - 1;
                if (count === 0) {
                  return {
                    ok: false as const,
                    error: `Edit ${
                      i + 1
                    }: oldString not found in "${path}". Re-read the file and copy the exact text including whitespace.`,
                  };
                }
                if (count > 1 && !replaceAll) {
                  return {
                    ok: false as const,
                    error: `Edit ${
                      i + 1
                    }: oldString is not unique in "${path}" (${count} matches). Add surrounding context to make it unique, or set replaceAll: true.`,
                  };
                }
                content = content.split(oldString).join(newString);
              }

              try {
                await sandbox.files.write(path, content);
              } catch (error) {
                return {
                  ok: false as const,
                  error: `Failed to write "${path}": ${String(error)}`,
                };
              }

              return { ok: true as const, path, content };
            });

            if (result && typeof result === "object" && "ok" in result) {
              if (result.ok) {
                network.state.data.files = {
                  ...currentFiles,
                  [result.path]: result.content,
                };
                return `Successfully applied ${edits.length} edit(s) to ${result.path}.`;
              }
              return `Edit failed — ${result.error}`;
            }
            return "Unknown error occurred while editing the file.";
          },
        }),
        createTool({
          name: "searchProject",
          description:
            "Search the project's source for a string or regex and get back matching `path:line — snippet` lines. Use this to locate where a symbol, className, import, or piece of text lives WITHOUT reading whole files — e.g. before an editFile. Much cheaper than reading candidate files. Excludes node_modules/.next/.git automatically.",
          parameters: z.object({
            query: z
              .string()
              .describe(
                "Literal text or an extended-regex (grep -E) pattern to search for"
              ),
            pathGlob: z
              .string()
              .optional()
              .describe(
                "Optional path or directory to scope the search, e.g. 'components' or 'app' (default: whole project)"
              ),
            maxResults: z
              .number()
              .optional()
              .describe("Max matching lines to return (default 50, capped at 200)"),
          }),
          handler: async ({ query, pathGlob, maxResults }, { step }) => {
            return await step?.run("searchProject", async () => {
              const cap = Math.min(Math.max(maxResults ?? 50, 1), 200);
              // grep is always present; -r recurses, so scope must be a path/dir,
              // not a "/**" glob — strip a trailing wildcard if the model adds one.
              const scope =
                (pathGlob || "").replace(/\/?\*+$/g, "").trim() || ".";
              // Single-quote args so the shell can't interpret them; escape any
              // embedded single quotes. Piping to head keeps grep's exit code from
              // throwing on "no matches" (head exits 0).
              const q = query.replace(/'/g, `'\\''`);
              const sc = scope.replace(/'/g, `'\\''`);
              const command =
                `grep -rnI --exclude-dir=node_modules --exclude-dir=.next ` +
                `--exclude-dir=.git -E -e '${q}' '${sc}' 2>/dev/null | head -n ${cap}`;
              try {
                const sandbox = await getSandbox(sandboxId);
                const buffers = { stdout: "", stderr: "" };
                const res = await sandbox.commands.run(command, {
                  onStdout: (d: string) => {
                    buffers.stdout += d;
                  },
                  onStderr: (d: string) => {
                    buffers.stderr += d;
                  },
                });
                const raw = (res.stdout || buffers.stdout || "").trim();
                if (!raw) {
                  return `No matches for "${query}"${
                    pathGlob ? ` in ${pathGlob}` : ""
                  }.`;
                }
                // Truncate long (e.g. minified) lines to stay token-cheap.
                const lines = raw
                  .split("\n")
                  .slice(0, cap)
                  .map((l) => (l.length > 240 ? l.slice(0, 240) + " …" : l));
                return lines.join("\n");
              } catch (error) {
                return `No matches or search error for "${query}": ${String(
                  error
                )}`;
              }
            });
          },
        }),
        createTool({
          name: "scrapeWebpage",
          description:
            "Fetch a live webpage via Firecrawl and return its structure and content as text context for recreation. " +
            "Returns the page's cleaned HTML (with class names and inline styles), markdown content, and links. " +
            "ONLY use this when the user provides a URL AND asks to recreate, clone, redesign, or take inspiration from that specific page. " +
            "Do NOT use it for generic build requests that don't reference a real URL.",
          parameters: z.object({
            url: z
              .string()
              .describe(
                "The full URL of the webpage to scrape, e.g. 'https://stripe.com/pricing'"
              ),
          }),
          handler: async ({ url }, { step }) => {
            return await step?.run("scrapeWebpage", async () => {
              const apiKey = process.env.FIRECRAWL_API_KEY;
              if (!apiKey) {
                return "Error: FIRECRAWL_API_KEY is not configured. Cannot scrape the webpage.";
              }

              try {
                const response = await fetch(
                  "https://api.firecrawl.dev/v2/scrape",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                      url,
                      // Keep nav/header/footer — they are part of a landing page's design.
                      // NOTE: the "branding" format is intentionally omitted — it runs an
                      // LLM extraction that takes 60s+ even on trivial pages and times out.
                      // The cleaned HTML retains class names + inline styles, which carry
                      // the design signal the model needs.
                      formats: ["markdown", "html", "links"],
                      onlyMainContent: false,
                      blockAds: true,
                      waitFor: 1500, // allow JS-rendered content to settle
                      timeout: 60000,
                    }),
                  }
                );

                if (!response.ok) {
                  if (response.status === 402) {
                    return "Error: Firecrawl request failed (402) — out of Firecrawl credits. Tell the user the scraping quota is exhausted.";
                  }
                  if (response.status === 429) {
                    return "Error: Firecrawl request failed (429) — rate limited. Wait a few seconds and try again.";
                  }
                  const errorText = await response.text().catch(() => "");
                  return `Error: Firecrawl request failed (${
                    response.status
                  }). ${errorText.slice(0, 500)}`;
                }

                const json = (await response.json()) as {
                  success?: boolean;
                  data?: {
                    markdown?: string;
                    html?: string;
                    links?: string[];
                    metadata?: {
                      title?: string;
                      description?: string;
                      language?: string;
                      sourceURL?: string;
                    };
                  };
                  error?: string;
                };

                if (!json.success || !json.data) {
                  return `Error: Firecrawl returned no data. ${
                    json.error || ""
                  }`.trim();
                }

                const data = json.data;
                const meta = data.metadata || {};

                // Caps protect the model's context window; tune as needed.
                const MARKDOWN_CAP = 12000;
                const HTML_CAP = 18000;
                const LINKS_CAP = 50;

                const sections: string[] = [];

                sections.push(
                  `# Scraped webpage: ${meta.title || "(untitled)"}\n` +
                    `Source URL: ${meta.sourceURL || url}` +
                    (meta.description
                      ? `\nDescription: ${meta.description}`
                      : "") +
                    (meta.language ? `\nLanguage: ${meta.language}` : "")
                );

                if (data.markdown) {
                  const truncated = data.markdown.length > MARKDOWN_CAP;
                  sections.push(
                    `## Content (markdown)${
                      truncated ? " — truncated" : ""
                    }\n` + data.markdown.slice(0, MARKDOWN_CAP)
                  );
                }

                if (data.html) {
                  const truncated = data.html.length > HTML_CAP;
                  sections.push(
                    `## HTML structure (cleaned)${
                      truncated ? " — truncated" : ""
                    }\n` +
                      "```html\n" +
                      data.html.slice(0, HTML_CAP) +
                      "\n```"
                  );
                }

                if (Array.isArray(data.links) && data.links.length > 0) {
                  const shown = data.links.slice(0, LINKS_CAP);
                  sections.push(
                    `## Links (${shown.length}${
                      data.links.length > LINKS_CAP
                        ? ` of ${data.links.length}`
                        : ""
                    })\n` + shown.join("\n")
                  );
                }

                sections.push(
                  "## Recreation guidance\n" +
                    "Recreate this page faithfully: match the structure from the HTML and the copy from the markdown. " +
                    "Derive the EXACT colors, fonts, and spacing from the HTML's class names and inline styles (do not substitute theme colors). " +
                    "Keep external image URLs found in the HTML as-is; if an image fails, use a same-size placeholder div."
                );

                return sections.join("\n\n");
              } catch (error) {
                return `Error: Failed to scrape the webpage — ${String(error)}`;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          // Per-inference instrumentation (see counters above).
          inferenceCount += 1;
          const nowTs = Date.now();
          const dt = ((nowTs - lastInferenceAt) / 1000).toFixed(1);
          lastInferenceAt = nowTs;
          const toolNames: string[] = [];
          for (const m of result.output || []) {
            const mm = m as {
              type?: string;
              tools?: Array<{ name?: string }>;
            };
            if (mm?.type === "tool_call" && Array.isArray(mm.tools)) {
              for (const t of mm.tools) if (t?.name) toolNames.push(t.name);
            }
          }
          const textLen = (lastAssistantTextMessageContent(result) || "").length;
          console.log(
            `[runChatAgent] inference #${inferenceCount} took ${dt}s — tools: [${
              toolNames.join(", ") || "none"
            }] — textLen: ${textLen}`
          );

          const lastAssistantTextMessageText =
            lastAssistantTextMessageContent(result);
          if (lastAssistantTextMessageText && network) {
            // Extract task_summary
            if (lastAssistantTextMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantTextMessageText;
            }
            // Extract title
            const titleMatch = lastAssistantTextMessageText.match(
              /<title>([\s\S]*?)<\/title>/i
            );
            if (titleMatch && titleMatch[1]?.trim()) {
              network.state.data.title = titleMatch[1].trim();
            }
            // Extract files_summary
            const filesSummaryMatch = lastAssistantTextMessageText.match(
              /<files_summary>([\s\S]*?)<\/files_summary>/
            );
            if (filesSummaryMatch) {
              network.state.data.filesSummary = filesSummaryMatch[0];
            }
            // Extract the route the agent built (flow pages)
            const route = extractRoute(lastAssistantTextMessageText);
            if (route) {
              network.state.data.route = route;
            }
          }

          // Extract reasoning_details from the last assistant message for reasoning models
          // The reasoning_details are returned in the raw response and need to be stored
          if (network && result.output.length > 0) {
            const lastMessage = result.output[result.output.length - 1];
            // Check if the message has reasoning_details (from reasoning models)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const messageWithReasoning = lastMessage as any;
            if (messageWithReasoning?.reasoning_details) {
              network.state.data.reasoningDetails =
                messageWithReasoning.reasoning_details;

              // Publish this turn's human-readable reasoning so the UI can show
              // live "thinking". Gemini returns a mix of reasoning.text (readable
              // summaries) and reasoning.encrypted (opaque) — surface only the
              // readable parts. Isolated to its own realtime topic so the main
              // agent_stream pipeline is untouched; failures are swallowed.
              try {
                const ch = userId || channelKey || screenId;
                const details = messageWithReasoning.reasoning_details;
                if (ch && Array.isArray(details)) {
                  const text = details
                    .filter(
                      (d: { type?: string; text?: string }) =>
                        d?.type === "reasoning.text" &&
                        typeof d?.text === "string"
                    )
                    .map((d: { text?: string }) => d.text as string)
                    .join("\n\n")
                    .trim();
                  if (text) {
                    reasoningTurn += 1;
                    await publish(
                      userChannel(ch).agent_reasoning({
                        turn: reasoningTurn,
                        text,
                      })
                    );
                  }
                }
              } catch (e) {
                console.warn("[runChatAgent] failed to publish reasoning:", e);
              }
            }
          }

          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "chat-agent-network",
      agents: [chatAgent],
      // Cap on agent iterations. It's only hit when the agent doesn't finish, so
      // raising it doesn't slow normal generations — it just gives heavier tasks
      // enough room to reach their final <task_summary> instead of being cut off.
      // Flow pages reuse an existing codebase (extra reads + project-wide
      // validation), so they need more room than a from-scratch build.
      // From-scratch builds also need headroom: image-heavy pages spend extra
      // turns on Pexels searches, and being cut off mid-build ships a page whose
      // imports point at component files that were never written (Module not found).
      maxIter: isFlowBuild ? 40 : 35,
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

    // Build the volatile per-turn context: the active-screen anchor + a paths-only
    // repo map (every file as `path — one-liner`, last turn's edits marked ▸). It is
    // injected INSIDE the current user turn — never persisted to the messages table —
    // so the prior history stays an append-only, cacheable prefix while only this
    // small, fresh map is paid for each turn. Source files/meta from what the agent
    // actually works against: the seeded set (parent's app on flow builds, else the
    // screen's own files) plus the screen's accumulated fileMeta.
    const contextFileMeta: FileMeta = isFlowBuild
      ? { ...(parentScreen?.fileMeta || {}), ...(screen?.fileMeta || {}) }
      : screen?.fileMeta || {};
    const anchor = buildActiveAnchor(screen);
    const repoMap = buildRepoMap(seedFiles, contextFileMeta, screen?.recentEdits);
    const contextPreamble = `${anchor}\n\n${repoMap}`;
    const messageWithContext = `${contextPreamble}\n\n---\n\n${message}`;

    console.log(
      `[runChatAgent] injected context: ${
        repoMap.split("\n").length
      } repo-map lines, ${contextPreamble.length} chars (history kept clean for cache)`
    );

    // Format message for the agent
    // For vision models with images, create multimodal content array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let runMessage: any = messageWithContext;

    if (imageUrls.length > 0) {
      // Create multimodal content array with text and images
      // Using OpenAI-compatible format (snake_case image_url)
      runMessage = [
        { type: "text", text: messageWithContext },
        ...imageUrls.map((url: string) => ({
          type: "image_url",
          image_url: { url },
        })),
      ];
    }

    // Run the network with streaming enabled if we have a channel
    // For multimodal content, AgentKit will pass it through to the model.
    // Wrap in try/catch so a failure is never silent: AgentKit collapses provider
    // failures into a generic "Provider returned error", so we log the real cause
    // + context here, and guarantee the user gets a visible message instead of a
    // hung UI. Transient transport errors (e.g. provider 500s) are already retried
    // by step.ai.infer before reaching here, so this is the final-failure handler.
    let result;
    try {
      result = await network.run(runMessage, {
        state,
        ...(targetChannel && {
          streaming: {
            publish: async (chunk: AgentMessageChunk) => {
              await publish(userChannel(targetChannel).agent_stream(chunk));
            },
          },
        }),
      });
    } catch (err) {
      const detail =
        err instanceof Error ? err.stack || err.message : String(err);
      console.error(`[runChatAgent] network.run failed: ${detail}`);
      console.error(
        `[runChatAgent] failure context: ${JSON.stringify({
          modelId,
          screenId,
          projectId,
          messageCount: previousMessages?.length ?? 0,
          hasImages: imageUrls.length > 0,
        })}`
      );

      // Make sure the user sees an error instead of an indefinitely-spinning UI.
      if (screenId) {
        await step.run("create-network-error-message", async () => {
          const convexHttpUrl = getConvexHttpUrl();
          const response = await fetch(
            `${convexHttpUrl}/inngest/createMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                screenId,
                role: "assistant",
                content:
                  "I encountered an error while generating the UI. Please try again with a different prompt or provide more details about what you'd like to create.",
              }),
            }
          );
          if (!response.ok) {
            const e = await response.json();
            throw new Error(`Failed to create error message: ${e.error}`);
          }
          return { success: true };
        });
      }

      await step.run("track-pendo-network-error", async () => {
        await trackPendoEvent("ai_generation_failed", clerkId || "system", {
          screen_id: screenId,
          project_id: projectId,
          model_id: modelId,
          error: detail.slice(0, 500),
        });
      });

      return {
        screenId,
        projectId,
        files: {} as Record<string, string>,
        summary: undefined as string | undefined,
        url: undefined as string | undefined,
        isError: true,
        // Surfaced in the Inngest run output so the real cause is visible there
        // (not just in the next dev terminal). Truncated to keep the payload small.
        errorDetail: detail.slice(0, 1000),
      };
    }

    // Check if the generation was successful
    // A generation is successful if we have a task_summary in the response
    // Files tracking might fail but the sandbox still has the generated code
    const hasSummary =
      result.state.data.summary &&
      result.state.data.summary.includes("<task_summary>");
    const hasFiles = Object.keys(result.state.data.files || {}).length > 0;

    // Log state for debugging
    console.log("[runChatAgent] Generation result:", {
      hasSummary,
      hasFiles,
      filesCount: Object.keys(result.state.data.files || {}).length,
      summaryLength: result.state.data.summary?.length || 0,
      inferences: inferenceCount,
      totalAgentSeconds: ((Date.now() - runStartedAt) / 1000).toFixed(1),
    });

    // Consider it an error only if we don't have a summary
    // Files might not be tracked but the sandbox still has them
    const isError = !hasSummary;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    // Update screen in Convex with sandbox URL, sandboxId, files, and title (only if no existing title)
    if (!isError && screenId) {
      await step.run("update-screen-in-convex", async () => {
        const convexHttpUrl = getConvexHttpUrl();

        // Only set title if screen doesn't already have one
        const shouldUpdateTitle = !screen?.title;
        const title = shouldUpdateTitle
          ? result.state.data.title ||
            extractTitle(result.state.data.summary || "")
          : undefined;

        // For flow builds, persist the route the agent created so the child's
        // iframe points at the new page. Prefer the route derived from the file
        // the agent actually wrote (ground truth: the URL must map to a real
        // page file), then the model's <route> tag, then any existing route.
        const route = isFlowBuild
          ? deriveRouteFromFiles(
              result.state.data.files,
              parentScreen?.files
            ) ||
            result.state.data.route ||
            screen?.route ||
            undefined
          : undefined;

        // Merge this turn's reported changes into the persistent file map (the
        // source of next turn's repo-map). The <files_summary> block is parsed into
        // structured changes here and is NO LONGER stored in the assistant message —
        // descriptions live in fileMeta, narrative lives in the short summary.
        const changes = parseChanges(result.state.data.filesSummary);
        const now = Date.now();
        const mergedFileMeta: FileMeta = { ...(screen?.fileMeta || {}) };
        for (const c of changes) {
          mergedFileMeta[c.path] = {
            description:
              c.description || mergedFileMeta[c.path]?.description || "",
            status: c.status,
            updatedAt: now,
          };
        }
        // Mark the files touched this turn so next turn's map flags them with ▸.
        const recentEdits = changes
          .filter((c) => c.status !== "deleted")
          .map((c) => c.path);

        const response = await fetch(`${convexHttpUrl}/inngest/updateScreen`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            screenId,
            sandboxUrl,
            sandboxId,
            files: result.state.data.files,
            fileMeta: mergedFileMeta,
            recentEdits,
            ...(title && { title }),
            ...(route && { route }),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to update screen: ${error.error}`);
        }

        return { success: true };
      });

      // Create the assistant message for chat history. We store ONLY the short,
      // human-readable summary now — the <files_summary> block is parsed into
      // screen.fileMeta (above) and surfaced through the repo-map, so replaying it
      // inside every message would just bloat history and rot the prompt cache.
      await step.run("create-assistant-message", async () => {
        const convexHttpUrl = getConvexHttpUrl();

        // Strip all control tags, leaving the plain summary shown in chat + replayed.
        const cleanSummary = (result.state.data.summary || "")
          .replace(/<task_summary>/gi, "")
          .replace(/<\/task_summary>/gi, "")
          .replace(/<title>[\s\S]*?<\/title>/gi, "")
          .replace(/<files_summary>[\s\S]*?<\/files_summary>/gi, "")
          .replace(/<route>[\s\S]*?<\/route>/gi, "")
          .trim();

        const messageContent =
          cleanSummary || "UI generation completed successfully.";

        // Include reasoning_details for reasoning models
        const reasoningDetails = result.state.data.reasoningDetails;

        // Build the message payload
        const messagePayload: Record<string, unknown> = {
          screenId,
          role: "assistant",
          content: messageContent,
        };

        // Add reasoning details if present (for reasoning models)
        if (reasoningDetails !== undefined && reasoningDetails !== null) {
          messagePayload.reasoningDetails = reasoningDetails;
        }

        const response = await fetch(`${convexHttpUrl}/inngest/createMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messagePayload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to create message: ${error.error}`);
        }

        return { success: true };
      });

      // Increment generation count on successful generation
      if (clerkId) {
        await step.run("increment-generation-count", async () => {
          const convexHttpUrl = getConvexHttpUrl();
          await fetch(`${convexHttpUrl}/inngest/incrementGeneration`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clerkId }),
          });
        });
      }

      // Track successful AI generation in Pendo
      await step.run("track-pendo-generation-completed", async () => {
        await trackPendoEvent(
          "ai_generation_completed",
          clerkId || "system",
          {
            screen_id: screenId,
            project_id: projectId,
            model_id: modelId,
            files_count: Object.keys(result.state.data.files || {}).length,
            has_title: !!result.state.data.title,
            sandbox_id: sandboxId,
          }
        );
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

      // Track failed AI generation in Pendo
      await step.run("track-pendo-generation-failed", async () => {
        await trackPendoEvent(
          "ai_generation_failed",
          clerkId || "system",
          {
            screen_id: screenId,
            project_id: projectId,
            model_id: modelId,
          }
        );
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
