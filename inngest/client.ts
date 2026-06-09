import { Inngest } from "inngest";
import { realtimeMiddleware } from "@inngest/realtime/middleware";

export const inngest = new Inngest({
  id: "unit-set",
  // In dev mode, events are sent directly to the dev server
  isDev: process.env.NODE_ENV === "development",
  // Enable realtime streaming for agent events
  middleware: [realtimeMiddleware()],
});
