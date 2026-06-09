import { channel, topic } from "@inngest/realtime";
import { AgentMessageChunkSchema } from "@inngest/agent-kit";

/**
 * Creates a realtime channel for streaming agent events.
 * Channel pattern: user:{channelKey}
 * Topic: agent_stream - typed with AgentMessageChunk for streaming events
 *
 * The channelKey can be any string (e.g., screenId, "screen:xyz", userId).
 * This matches the pattern used by @inngest/use-agent.
 */
export const userChannel = channel(
  (channelKey: string) => `user:${channelKey}`
).addTopic(topic("agent_stream").schema(AgentMessageChunkSchema));
