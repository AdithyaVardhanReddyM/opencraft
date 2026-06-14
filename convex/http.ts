import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * HTTP endpoint for Inngest workflow to update screen data
 * This endpoint is called after AI generation completes
 */
http.route({
  path: "/inngest/updateScreen",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { screenId, sandboxUrl, sandboxId, files, title } =
        await request.json();

      if (!screenId) {
        return new Response(JSON.stringify({ error: "screenId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await ctx.runMutation(internal.screens.internalUpdateScreen, {
        screenId,
        sandboxUrl,
        sandboxId,
        files,
        title,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error updating screen:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Internal error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * HTTP endpoint for Inngest workflow to create messages
 * This endpoint is called to add assistant responses to chat threads
 */
http.route({
  path: "/inngest/createMessage",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { screenId, role, content, reasoningDetails } =
        await request.json();

      if (!screenId || !role || !content) {
        return new Response(
          JSON.stringify({
            error: "screenId, role, and content are required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const messageId = await ctx.runMutation(
        internal.messages.internalCreateMessage,
        {
          screenId,
          role,
          content,
          reasoningDetails, // Pass reasoning details for models like Gemini 3 Pro
        }
      );

      return new Response(JSON.stringify({ success: true, messageId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error creating message:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Internal error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * HTTP endpoint for Inngest workflow to get screen data
 * This endpoint is called to fetch screen with sandboxId for reuse
 */
http.route({
  path: "/inngest/getScreen",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { screenId } = await request.json();

      if (!screenId) {
        return new Response(JSON.stringify({ error: "screenId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const screen = await ctx.runQuery(internal.screens.internalGetScreen, {
        screenId,
      });

      return new Response(JSON.stringify(screen), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting screen:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Internal error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * HTTP endpoint for Inngest workflow to get message history
 * This endpoint is called to fetch previous messages for agent context
 */
http.route({
  path: "/inngest/getMessages",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { screenId, limit } = await request.json();

      if (!screenId) {
        return new Response(JSON.stringify({ error: "screenId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const messages = await ctx.runQuery(
        internal.messages.internalGetMessages,
        {
          screenId,
          limit: limit || 10,
        }
      );

      return new Response(JSON.stringify(messages), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting messages:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Internal error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * HTTP endpoint for Inngest workflow to check if user can generate
 */
http.route({
  path: "/inngest/canGenerate",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { clerkId } = await request.json();

      if (!clerkId) {
        return new Response(JSON.stringify({ error: "clerkId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await ctx.runQuery(internal.users.internalCanGenerate, {
        clerkId,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error checking generation limit:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Internal error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * HTTP endpoint for Inngest workflow to increment generation count
 * Called only on successful generation (no error)
 */
http.route({
  path: "/inngest/incrementGeneration",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { clerkId } = await request.json();

      if (!clerkId) {
        return new Response(JSON.stringify({ error: "clerkId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await ctx.runMutation(
        internal.users.internalIncrementGeneration,
        { clerkId }
      );

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error incrementing generation:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Internal error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
