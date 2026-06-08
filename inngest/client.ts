import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "unit-set",
  // In dev mode, events are sent directly to the dev server
  isDev: process.env.NODE_ENV === "development",
});
