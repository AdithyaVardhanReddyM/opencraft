# Requirements Document

## Introduction

This feature implements real-time streaming for the AI chat workflow in Unit {set}. Currently, when users send messages in the AISidebar, they see a brief "Thinking..." indicator that disappears, followed by a delayed response when the background Inngest job completes. This creates a poor user experience with no visibility into what the AI agent is doing.

The solution integrates Inngest AgentKit's real-time streaming capabilities to provide live feedback during agent execution. Users will see a shimmer animation with streaming status updates showing agent activities (tool calls, text generation, etc.) until the final response arrives.

## Glossary

- **AgentKit**: Inngest's TypeScript framework for building multi-agent networks with streaming support
- **Realtime Middleware**: Inngest middleware that enables WebSocket-based streaming of agent events
- **AgentMessageChunk**: Typed event payload containing streaming data (text deltas, tool calls, status updates)
- **useAgent Hook**: React hook from `@inngest/use-agent` that manages streaming state and message display
- **Channel**: A named realtime communication pathway for publishing/subscribing to agent events
- **Topic**: A typed message category within a channel (e.g., "agent_stream")
- **Transport**: Configuration layer that handles API endpoints and authentication for the streaming connection
- **Shimmer**: An animated text effect that displays streaming status messages with a visual sweep animation
- **AISidebar**: The chat panel component where users interact with the AI agent
- **Screen**: A canvas shape that represents an AI-generated UI with associated chat history

## Requirements

### Requirement 1

**User Story:** As a user, I want to see real-time feedback when the AI is processing my request, so that I understand what's happening and don't think the system is frozen.

#### Acceptance Criteria

1. WHEN a user sends a message THEN the AISidebar SHALL display a shimmer animation with status text indicating agent activity
2. WHEN the agent starts processing THEN the system SHALL show "Starting..." status in the shimmer component
3. WHEN the agent executes a tool THEN the system SHALL display the tool name in the shimmer status (e.g., "Running terminal...", "Writing files...")
4. WHEN the agent generates text THEN the system SHALL update the shimmer to show "Generating response..."
5. WHEN the agent completes THEN the system SHALL replace the shimmer with the final assistant message

### Requirement 2

**User Story:** As a developer, I want the streaming infrastructure to be properly configured, so that real-time events flow from the Inngest backend to the React frontend.

#### Acceptance Criteria

1. THE Inngest client SHALL include the realtimeMiddleware for streaming support
2. THE system SHALL define a typed realtime channel with an "agent_stream" topic for AgentMessageChunk events
3. THE system SHALL provide a `/api/realtime/token` endpoint that generates subscription tokens for authenticated users
4. THE chat API route SHALL pass the channelKey to the Inngest event for proper channel targeting
5. THE Inngest function SHALL publish streaming chunks to the realtime channel during agent execution

### Requirement 3

**User Story:** As a user, I want my chat experience to remain functional even if streaming fails, so that I can still use the AI features.

#### Acceptance Criteria

1. IF the WebSocket connection fails THEN the system SHALL fall back to polling-based message updates via Convex subscriptions
2. IF a streaming error occurs THEN the system SHALL display an error indicator and allow retry
3. WHEN the streaming connection is lost mid-conversation THEN the system SHALL attempt to reconnect automatically
4. THE system SHALL maintain message persistence in Convex regardless of streaming status

### Requirement 4

**User Story:** As a user, I want the streaming status to be visually appealing and consistent with the app design, so that the experience feels polished.

#### Acceptance Criteria

1. THE shimmer component SHALL use the existing Shimmer component from ai-elements with appropriate styling
2. THE streaming indicator SHALL display below the user's message in the conversation flow
3. THE status text SHALL be concise and descriptive (max 30 characters)
4. WHEN transitioning from shimmer to final message THEN the system SHALL animate smoothly without layout jumps

### Requirement 5

**User Story:** As a developer, I want the streaming state to be properly typed and managed, so that the codebase remains maintainable.

#### Acceptance Criteria

1. THE system SHALL define TypeScript types for all streaming events and state
2. THE useAgent hook configuration SHALL be properly typed with tool manifest and client state
3. THE streaming events SHALL be mapped to appropriate UI states (ready, submitted, streaming, error)
4. THE system SHALL handle all AgentKit event types (run.started, text.delta, tool_call.\*, part.completed, run.completed, stream.ended)
