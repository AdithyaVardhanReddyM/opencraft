import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Create a new screen record
 * Called when a Screen shape is added to the canvas
 */
export const createScreen = mutation({
  args: {
    shapeId: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify project exists and user owns it
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== identity.subject) {
      throw new Error("Not authorized to access this project");
    }

    const now = Date.now();
    const screenId = await ctx.db.insert("screens", {
      shapeId: args.shapeId,
      projectId: args.projectId,
      createdAt: now,
      updatedAt: now,
    });

    return screenId;
  },
});

/**
 * Update a screen record with sandbox URL, files, and title
 * Called by Inngest workflow after AI generation completes
 */
export const updateScreen = mutation({
  args: {
    screenId: v.id("screens"),
    sandboxUrl: v.optional(v.string()),
    files: v.optional(v.any()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify screen exists
    const screen = await ctx.db.get(args.screenId);
    if (!screen) {
      throw new Error("Screen not found");
    }

    // Verify user owns the project
    const project = await ctx.db.get(screen.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Not authorized to update this screen");
    }

    // Build patch object with only provided fields
    const patch: {
      sandboxUrl?: string;
      files?: unknown;
      title?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.sandboxUrl !== undefined) {
      patch.sandboxUrl = args.sandboxUrl;
    }
    if (args.files !== undefined) {
      patch.files = args.files;
    }
    if (args.title !== undefined) {
      patch.title = args.title;
    }

    await ctx.db.patch(args.screenId, patch);

    return { success: true };
  },
});

/**
 * Delete a screen and all associated messages
 * Called when user confirms deletion of a Screen shape
 */
export const deleteScreen = mutation({
  args: {
    screenId: v.id("screens"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify screen exists
    const screen = await ctx.db.get(args.screenId);
    if (!screen) {
      throw new Error("Screen not found");
    }

    // Verify user owns the project
    const project = await ctx.db.get(screen.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Not authorized to delete this screen");
    }

    // Delete all messages for this screen
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_screenId", (q) => q.eq("screenId", args.screenId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the screen
    await ctx.db.delete(args.screenId);

    return { success: true };
  },
});

/**
 * Get a screen by its canvas shape ID
 */
export const getScreenByShapeId = query({
  args: {
    shapeId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const screen = await ctx.db
      .query("screens")
      .withIndex("by_shapeId", (q) => q.eq("shapeId", args.shapeId))
      .first();

    if (!screen) {
      return null;
    }

    // Verify user owns the project
    const project = await ctx.db.get(screen.projectId);
    if (!project || project.userId !== identity.subject) {
      return null;
    }

    return screen;
  },
});

/**
 * Get all screens for a project
 */
export const getScreensByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Verify user owns the project
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      return [];
    }

    const screens = await ctx.db
      .query("screens")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    return screens;
  },
});

/**
 * Internal mutation to update a screen (called by Inngest workflow)
 * Does not require authentication - used for server-to-server calls
 */
export const internalUpdateScreen = internalMutation({
  args: {
    screenId: v.id("screens"),
    sandboxUrl: v.optional(v.string()),
    files: v.optional(v.any()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify screen exists
    const screen = await ctx.db.get(args.screenId);
    if (!screen) {
      throw new Error("Screen not found");
    }

    // Build patch object with only provided fields
    const patch: {
      sandboxUrl?: string;
      files?: unknown;
      title?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.sandboxUrl !== undefined) {
      patch.sandboxUrl = args.sandboxUrl;
    }
    if (args.files !== undefined) {
      patch.files = args.files;
    }
    if (args.title !== undefined) {
      patch.title = args.title;
    }

    await ctx.db.patch(args.screenId, patch);

    return { success: true };
  },
});
