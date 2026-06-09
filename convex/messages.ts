import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Create a new message in a screen's chat thread
 */
export const createMessage = mutation({
  args: {
    screenId: v.id("screens"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
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
      throw new Error("Not authorized to add messages to this screen");
    }

    const messageId = await ctx.db.insert("messages", {
      screenId: args.screenId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Get messages for a screen's chat thread
 * Returns messages ordered by creation time (oldest first)
 */
export const getMessages = query({
  args: {
    screenId: v.id("screens"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Verify screen exists
    const screen = await ctx.db.get(args.screenId);
    if (!screen) {
      return [];
    }

    // Verify user owns the project
    const project = await ctx.db.get(screen.projectId);
    if (!project || project.userId !== identity.subject) {
      return [];
    }

    let query = ctx.db
      .query("messages")
      .withIndex("by_screenId", (q) => q.eq("screenId", args.screenId))
      .order("asc");

    const messages = await query.collect();

    // Apply limit if specified (take last N messages)
    if (args.limit && messages.length > args.limit) {
      return messages.slice(-args.limit);
    }

    return messages;
  },
});

/**
 * Delete all messages for a screen
 * Called when a screen is deleted
 */
export const deleteMessagesByScreen = mutation({
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
      throw new Error("Not authorized to delete messages for this screen");
    }

    // Delete all messages for this screen
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_screenId", (q) => q.eq("screenId", args.screenId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return { deletedCount: messages.length };
  },
});

/**
 * Internal mutation to create a message (called by Inngest workflow)
 * Does not require authentication - used for server-to-server calls
 */
export const internalCreateMessage = internalMutation({
  args: {
    screenId: v.id("screens"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify screen exists
    const screen = await ctx.db.get(args.screenId);
    if (!screen) {
      throw new Error("Screen not found");
    }

    const messageId = await ctx.db.insert("messages", {
      screenId: args.screenId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });

    return messageId;
  },
});
