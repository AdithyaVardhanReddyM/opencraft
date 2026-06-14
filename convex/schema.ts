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
    files: v.optional(v.any()), // Generated files JSON: { [path: string]: string }
    theme: v.optional(v.string()), // Selected theme ID (default, claude, vercel, etc.)
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
    reasoningDetails: v.optional(v.any()), // Reasoning details for models like Gemini 3 Pro (pass back unmodified)
    createdAt: v.number(), // Creation timestamp
  }).index("by_screenId", ["screenId"]),
});
