import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User generation tracking
  users: defineTable({
    clerkId: v.string(), // Clerk user ID (subject)
    generationsUsed: v.number(), // Number of successful generations
    generationsLimit: v.number(), // Max generations allowed (default: 10)
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  projects: defineTable({
    userId: v.string(), // Clerk user ID
    name: v.string(),
    description: v.optional(v.string()),
    styleGuide: v.optional(v.string()),
    sketchesData: v.any(), // JSON structure for EntityState<Shape>
    viewportData: v.optional(v.any()), // JSON structure for viewport state (scale, translate)
    canvasVersion: v.optional(v.string()), // Schema version for migrations
    generatedDesignData: v.optional(v.any()), // JSON structure for generated UI components
    thumbnail: v.optional(v.string()), // Base64 or URL for project thumbnail
    moodBoardImages: v.optional(v.array(v.string())), // Array of storage IDs for mood board images
    inspirationImages: v.optional(v.array(v.string())), // Array of storage IDs for inspiration images (max 6)
    lastModified: v.number(), // Timestamp for last modification
    createdAt: v.number(), // Project creation timestamp
    isPublic: v.optional(v.boolean()), // For future sharing features
    tags: v.optional(v.array(v.string())), // For future categorization
    projectNumber: v.number(), // Auto-incrementing project number per user
    // Canvas autosave fields
    frameCounter: v.optional(v.number()), // Frame counter for auto-incrementing frame numbers
    selectedIds: v.optional(v.any()), // Selection state
    tool: v.optional(v.string()), // Current tool
  }).index("by_userId", ["userId"]),

  // Screen shapes for AI-generated web content
  screens: defineTable({
    shapeId: v.string(), // Canvas shape ID (nanoid)
    projectId: v.id("projects"), // Parent project reference
    title: v.optional(v.string()), // Screen title (from AI summary)
    sandboxUrl: v.optional(v.string()), // E2B sandbox URL for iframe
    sandboxId: v.optional(v.string()), // E2B sandbox ID for persistence and lifecycle management
    files: v.optional(v.any()), // Generated files JSON: { [path: string]: string } — ground-truth sandbox mirror (NOT injected into the model context)
    // Paths-only repo-map source. One entry per file: a short one-liner the agent
    // emitted, plus status/timestamp. Drives the per-turn repo-map injected into the
    // user message so the agent never re-discovers the file list — replaces the old
    // scattered <files_summary> blobs that used to live inside each assistant message.
    fileMeta: v.optional(v.any()), // Record<path, { description: string; status: "active" | "deleted"; updatedAt: number }>
    recentEdits: v.optional(v.array(v.string())), // Paths touched on the previous turn — marked "▸ … ⟵ edited last turn" in the repo-map
    theme: v.optional(v.string()), // Selected theme ID (default, claude, vercel, etc.)
    // Flow fields: a "flow child" is a screen that shares its parent's sandbox and
    // displays a different route (page) of the same app — used to model user flows.
    parentScreenId: v.optional(v.id("screens")), // Set on flow children; references the originating screen
    route: v.optional(v.string()), // Path this screen displays ("/" for roots, e.g. "/checkout" for children)
    createdAt: v.number(), // Creation timestamp
    updatedAt: v.number(), // Last update timestamp
  })
    .index("by_shapeId", ["shapeId"])
    .index("by_projectId", ["projectId"]),

  // Chat messages for screen threads
  messages: defineTable({
    screenId: v.id("screens"), // Parent screen reference
    role: v.union(v.literal("user"), v.literal("assistant")), // Message sender
    content: v.string(), // Message content
    modelId: v.optional(v.string()), // AI model used for this message
    imageIds: v.optional(v.array(v.id("_storage"))), // Attached image storage IDs
    reasoningDetails: v.optional(v.any()), // Reasoning details for reasoning models (pass back unmodified)
    createdAt: v.number(), // Creation timestamp
  }).index("by_screenId", ["screenId"]),

  // Durable store for OpenRouter reasoning_details, keyed by tool_call_id.
  // Reasoning models require their reasoning_details to be re-submitted on every
  // tool-call continuation. The OpenRouter proxy writes them here after each
  // inference and reads them back when re-sending the assistant message — replacing
  // a per-process in-memory Map that was wiped on dev reloads and not shared across
  // serverless instances (the source of intermittent "Provider returned error").
  reasoningTokens: defineTable({
    toolCallId: v.string(), // OpenRouter assistant tool_call id
    details: v.any(), // reasoning_details payload, stored/returned unmodified
    createdAt: v.number(), // Creation timestamp (used for TTL cleanup)
  })
    .index("by_toolCallId", ["toolCallId"])
    .index("by_createdAt", ["createdAt"]),
});
