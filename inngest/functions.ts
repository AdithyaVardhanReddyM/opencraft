import { createAgent, openai } from "@inngest/agent-kit";
import { inngest } from "./client";

// OpenRouter provider using OpenAI-compatible API
const openrouter = (config: { model: string }) =>
  openai({
    model: config.model,
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: "https://openrouter.ai/api/v1",
  });

// Simple chat agent
const chatAgent = createAgent({
  name: "Chat Assistant",
  description: "A helpful assistant for design and development questions",
  system: `You are a helpful AI assistant integrated into Unit {set}, a design-to-code platform.
You help users with:
- Design questions and best practices
- Code generation and debugging
- General development assistance

Be concise, friendly, and helpful. Keep responses focused and actionable.`,
  model: openrouter({ model: "x-ai/grok-4.1-fast:free" }),
});

// Chat function - directly invoke agent without network
export const runChatAgent = inngest.createFunction(
  { id: "run-chat-agent" },
  { event: "chat/message.sent" },
  async ({ event }) => {
    const { message, threadId } = event.data;

    const result = await chatAgent.run(message);

    // Extract text response from the agent output
    const output = result.output;
    const textMessage = output.find((m) => m.type === "text");
    const response = textMessage?.content || "No response generated.";

    return {
      threadId,
      response,
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
