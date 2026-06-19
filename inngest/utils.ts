import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, TextMessage, Message } from "@inngest/agent-kit";

/**
 * Message record from Convex database
 */
export interface ConvexMessage {
  _id: string;
  screenId: string;
  role: "user" | "assistant";
  content: string;
  reasoningDetails?: unknown; // Reasoning details for reasoning models
  createdAt: number;
}

/**
 * One repo-map entry: the agent's one-liner for a file, plus lifecycle status.
 * Stored on the screen (screen.fileMeta) and used to render the per-turn repo-map.
 */
export interface FileMetaEntry {
  description: string;
  status: "active" | "deleted";
  updatedAt: number;
}

export type FileMeta = Record<string, FileMetaEntry>;

/**
 * Screen record from Convex database
 */
export interface ConvexScreen {
  _id: string;
  shapeId: string;
  projectId: string;
  title?: string;
  sandboxUrl?: string;
  sandboxId?: string;
  files?: Record<string, string>; // Ground-truth sandbox mirror — NOT injected into the model context
  fileMeta?: FileMeta; // Source of the paths-only repo-map one-liners
  recentEdits?: string[]; // Paths touched last turn (for the "▸ … ⟵ edited last turn" marker)
  parentScreenId?: string; // Set on flow children; references the originating screen
  route?: string; // Route (page) this screen displays, e.g. "/checkout"
  createdAt: number;
  updatedAt: number;
}

/**
 * Connect to an existing sandbox
 */
export async function getSandbox(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId);
  return sandbox;
}

/**
 * Extract the last assistant text message content from agent result
 */
export function lastAssistantTextMessageContent(result: AgentResult) {
  const lastAssistantTextMessageIndex = result.output.findLastIndex(
    (message) => message.role === "assistant"
  );

  const message = result.output[lastAssistantTextMessageIndex] as
    | TextMessage
    | undefined;

  return message?.content
    ? typeof message.content === "string"
      ? message.content
      : message.content.map((c) => c.text).join("")
    : undefined;
}

/**
 * Extended message type that includes reasoning_details for reasoning models
 * We use intersection type to ensure compatibility with Message while adding reasoning_details
 */
export type ExtendedMessage = Message & {
  reasoning_details?: unknown;
};

/**
 * Format Convex messages for agent context
 * Transforms database messages to AgentKit Message format
 * Preserves order and content including files_summary and reasoning_details
 * Returns Message[] for compatibility with AgentKit, but includes reasoning_details when present
 */
export function formatMessagesForAgent(messages: ConvexMessage[]): Message[] {
  return messages.map((msg) => {
    // Base message structure matching TextMessage type
    const baseMessage: TextMessage = {
      type: "text" as const,
      role: msg.role,
      content: msg.content,
    };

    // Include reasoning_details if present (required for reasoning model multi-turn)
    // This is passed through to the API even though it's not in the Message type
    // We cast to unknown first then to Message to allow the extra property
    if (msg.reasoningDetails) {
      return {
        ...baseMessage,
        reasoning_details: msg.reasoningDetails,
      } as unknown as Message;
    }

    return baseMessage;
  });
}

/**
 * Determine if a new sandbox should be created based on screen state
 * Returns true if sandboxId is null, undefined, or empty string
 */
export function shouldCreateNewSandbox(screen: ConvexScreen | null): boolean {
  if (!screen) {
    return true;
  }
  return !screen.sandboxId || screen.sandboxId.trim() === "";
}

/**
 * A single file change reported by the agent in its final output, parsed from the
 * per-file list inside <files_summary> (or <changes>). Feeds screen.fileMeta, which
 * in turn drives the repo-map — so we no longer replay the raw block in history.
 */
export interface FileChange {
  path: string;
  description: string;
  status: "active" | "deleted";
}

/**
 * Clean a candidate file path from a summary line: strip bullets/quotes/backticks
 * and a leading "./" or "/". Returns undefined for prose (anything with whitespace)
 * or non-path-looking text, so a stray sentence in the block can't pollute fileMeta.
 */
function normalizeFilePath(raw: string): string | undefined {
  const p = raw
    .trim()
    .replace(/^[`'"]+|[`'"]+$/g, "")
    .trim()
    .replace(/^\.?\//, "");
  if (!p || /\s/.test(p)) return undefined; // reject empty / prose
  // Must look path-ish: contain a slash or end in a file extension.
  if (!p.includes("/") && !/\.[a-zA-Z0-9]+$/.test(p)) return undefined;
  return p;
}

/**
 * Parse the agent's per-file change list (the body of <files_summary> / <changes>)
 * into structured FileChange entries. Accepts lines like:
 *   - app/page.tsx: landing page with hero and pricing
 *   - deleted components/old-hero.tsx
 *   - lib/utils.ts            (bare path, no description)
 * Tags are optional; unparseable/prose lines are skipped.
 */
export function parseChanges(text: string | undefined | null): FileChange[] {
  if (!text) return [];
  const inner = text
    .replace(/<\/?files_summary>/gi, "")
    .replace(/<\/?changes>/gi, "")
    .trim();

  const changes: FileChange[] = [];
  const seen = new Set<string>();

  for (const rawLine of inner.split("\n")) {
    const line = rawLine.trim().replace(/^[-*]\s*/, ""); // drop list bullet
    if (!line) continue;

    // Deletion markers: "deleted path" or "deleted: path".
    const del = line.match(/^deleted[:\s]+(.+)$/i);
    if (del) {
      const path = normalizeFilePath(del[1]);
      if (path && !seen.has(path)) {
        seen.add(path);
        changes.push({ path, description: "", status: "deleted" });
      }
      continue;
    }

    // "path: description" — split on the FIRST colon (paths have no colons).
    const idx = line.indexOf(":");
    const rawPath = idx === -1 ? line : line.slice(0, idx);
    const description = idx === -1 ? "" : line.slice(idx + 1).trim();
    const path = normalizeFilePath(rawPath);
    if (path && !seen.has(path)) {
      seen.add(path);
      changes.push({ path, description, status: "active" });
    }
  }

  return changes;
}

/**
 * Normalize an agent-reported route to a clean, leading-slash path.
 * Returns undefined for empty/root values. Strips a trailing slash so it joins
 * cleanly with a sandbox base URL.
 */
export function normalizeRoute(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  let route = raw.trim();
  if (!route || route === "/") return undefined;
  // Drop a leading origin if the model returned a full URL.
  route = route.replace(/^https?:\/\/[^/]+/i, "");
  if (!route.startsWith("/")) route = `/${route}`;
  route = route.replace(/\/+$/, "");
  return route || undefined;
}

/**
 * Extract the route from an explicit <route> tag in the agent's final output.
 * Used for flow pages so the child screen's iframe can point at the new page.
 */
export function extractRoute(content: string): string | undefined {
  const match = content.match(/<route>([\s\S]*?)<\/route>/i);
  return normalizeRoute(match ? match[1] : undefined);
}

/**
 * Convert a Next.js app-router page file path to its URL route.
 * e.g. "app/pricing/page.tsx" -> "/pricing", "app/(shop)/cart/page.tsx" -> "/cart".
 * Route groups "(group)" are stripped; dynamic "[param]" segments are kept as-is.
 * Returns undefined for the root page ("app/page.tsx") or non-page paths.
 */
export function pageFilePathToRoute(rawPath: string): string | undefined {
  const path = rawPath.replace(/^\.?\//, ""); // strip leading "./" or "/"
  const match = path.match(/^app\/(.+)\/page\.(tsx|ts|jsx|js)$/);
  if (!match) return undefined; // not a nested page (app/page.tsx has no capture)
  const segments = match[1]
    .split("/")
    .filter((s) => s && !(s.startsWith("(") && s.endsWith(")"))); // drop route groups
  if (segments.length === 0) return undefined;
  return `/${segments.join("/")}`;
}

/**
 * Derive the route a flow build created by inspecting the files it wrote.
 * The agent's state files are seeded from the parent, so a page path that is NOT
 * present in the parent is the page just added for this flow. This is more
 * reliable than the model's <route> tag, since the URL must map to a real file.
 * Falls back to any non-root app page if nothing looks newly added.
 */
export function deriveRouteFromFiles(
  files: Record<string, string> | undefined,
  parentFiles: Record<string, string> | undefined
): string | undefined {
  if (!files) return undefined;
  const norm = (p: string) => p.replace(/^\.?\//, "");
  const parentKeys = new Set(Object.keys(parentFiles || {}).map(norm));

  const pages = Object.keys(files)
    .map(norm)
    .map((p) => ({ path: p, route: pageFilePathToRoute(p) }))
    .filter((x): x is { path: string; route: string } => !!x.route);

  if (pages.length === 0) return undefined;

  // Prefer a page that wasn't in the parent (the one created for this flow).
  const fresh = pages.find((x) => !parentKeys.has(x.path));
  return (fresh ?? pages[0]).route;
}

/**
 * The "active-screen anchor" — ~15 tokens that tell the agent exactly which page
 * this thread edits, so its first read lands on the right file. Root screens edit
 * app/page.tsx; flow children edit app/<route>/page.tsx.
 */
export function buildActiveAnchor(screen: ConvexScreen | null): string {
  const route =
    screen?.route && screen.route !== "/" ? screen.route : undefined;
  const entryFile = route ? `app${route}/page.tsx` : "app/page.tsx";
  return `Active screen: this conversation edits the page at route "${
    route || "/"
  }" → ${entryFile}. Scope edits to this page and the components it uses, unless the user explicitly asks otherwise.`;
}

/**
 * Build the paths-only repo-map injected into the current user turn. Lists EVERY
 * file (union of the on-disk mirror `files` and the described `fileMeta`) as
 * `path — one-liner`, marking files edited last turn with "▸ … ⟵ edited last turn".
 * Never includes file CONTENTS — only keys + the agent's own one-liners — so it
 * stays flat in project size and cheap to send every turn. Deleted files are hidden.
 */
export function buildRepoMap(
  files: Record<string, string> | undefined,
  fileMeta: FileMeta | undefined,
  recentEdits?: string[]
): string {
  const norm = (p: string) => p.replace(/^\.?\//, "");
  const fileKeys = files || {};
  const meta = fileMeta || {};

  const paths = new Set<string>();
  for (const p of Object.keys(fileKeys)) paths.add(norm(p));
  for (const p of Object.keys(meta)) paths.add(norm(p));

  const recent = new Set((recentEdits ?? []).map(norm));

  const lines: string[] = [];
  for (const path of [...paths].sort()) {
    const entry = meta[path] || meta[`./${path}`];
    if (entry?.status === "deleted") continue; // don't advertise removed files
    const description = entry?.description ? ` — ${entry.description}` : "";
    lines.push(
      recent.has(path)
        ? `▸ ${path}${description}   ⟵ edited last turn`
        : `  ${path}${description}`
    );
  }

  if (lines.length === 0) {
    return "Repo map: (empty project — no files yet; build from scratch).";
  }

  return [
    "Repo map — every file currently in this project (paths + one-liners). To edit a file, read it on demand; do NOT run ls/cat to re-discover the file list. Files marked ▸ were edited last turn.",
    ...lines,
  ].join("\n");
}
