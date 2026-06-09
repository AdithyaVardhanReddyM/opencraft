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
      const { screenId, sandboxUrl, files, title } = await request.json();

      if (!screenId) {
        return new Response(JSON.stringify({ error: "screenId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await ctx.runMutation(internal.screens.internalUpdateScreen, {
        screenId,
        sandboxUrl,
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
      const { screenId, role, content } = await request.json();

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

export default http;
