# Implementation Plan

- [x] 1. Set up streaming infrastructure

  - [x] 1.1 Update Inngest client with realtime middleware
    - Modify `inngest/client.ts` to import and add `realtimeMiddleware` from `@inngest/realtime`
    - _Requirements: 2.1_
  - [x] 1.2 Create realtime channel definition
    - Create `inngest/realtime.ts` with typed channel for `screen:{screenId}` pattern
    - Define `agent_stream` topic with `AgentMessageChunk` type
    - _Requirements: 2.2_
  - [x] 1.3 Create realtime token endpoint
    - Create `app/api/realtime/token/route.ts`
    - Implement POST handler that validates Clerk auth and returns Inngest realtime token
    - _Requirements: 2.3_

- [x] 2. Create streaming utilities

  - [x] 2.1 Implement streaming status mapper
    - Create `lib/streaming-utils.ts` with event-to-status mapping functions
    - Implement `getStatusTextForEvent()` that maps AgentKit events to human-readable status text
    - Implement `mapEventToStatus()` that returns StreamingStatus from events
    - _Requirements: 1.2, 1.3, 1.4, 5.3, 5.4_
  - [ ]\* 2.2 Write property test for tool call status text
    - **Property 2: Tool call events produce tool-specific status text**
    - **Validates: Requirements 1.3**
  - [ ]\* 2.3 Write property test for status text length constraint
    - **Property 3: Status text length constraint**
    - **Validates: Requirements 4.3**
  - [ ]\* 2.4 Write property test for event-to-state mapping completeness
    - **Property 4: Event-to-state mapping completeness**
    - **Validates: Requirements 5.3, 5.4**

- [x] 3. Checkpoint - Make sure all tests are passing

  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create streaming indicator component

  - [x] 4.1 Implement StreamingIndicator component
    - Create `components/canvas/StreamingIndicator.tsx`
    - Use existing Shimmer component from ai-elements
    - Accept `statusText` and `isVisible` props
    - Style to match AISidebar design (left-aligned with logo)
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Update Inngest function for streaming

  - [x] 5.1 Modify runChatAgent to publish streaming events
    - Update `inngest/functions.ts` to accept `channelKey` from event data
    - Import `createChannel` from realtime.ts
    - Add streaming configuration to `network.run()` with publish callback
    - Publish `AgentMessageChunk` events to the realtime channel
    - _Requirements: 2.5_

- [x] 6. Update chat API route

  - [x] 6.1 Add channelKey to chat request handling
    - Update `app/api/chat/route.ts` to accept and validate `channelKey` parameter
    - Pass `channelKey` to Inngest event data
    - _Requirements: 2.4_

- [x] 7. Integrate streaming into AISidebar

  - [x] 7.1 Add AgentProvider wrapper
    - Create provider component or add to existing provider hierarchy
    - Configure transport with token endpoint and chat API
    - _Requirements: 2.3, 5.2_
  - [x] 7.2 Refactor AISidebar to use useAgent hook
    - Import and configure `useAgent` hook with channelKey based on screenId
    - Replace local message state with hook's messages
    - Map hook's status to ChatInputStatus
    - Handle `onEvent` callback to update streaming status text
    - _Requirements: 1.1, 5.1, 5.2_
  - [x] 7.3 Add StreamingIndicator to conversation flow
    - Render StreamingIndicator when status is "streaming"
    - Position below user message in conversation
    - Pass current statusText from event handler
    - _Requirements: 1.1, 1.5, 4.2_
  - [x] 7.4 Implement fallback to Convex polling
    - Check `isConnected` from useAgent hook
    - When disconnected, use Convex subscription for messages
    - Merge streaming and Convex messages appropriately
    - _Requirements: 3.1, 3.4_
  - [x] 7.5 Handle streaming errors
    - Implement `onError` callback in useAgent
    - Display error indicator when streaming fails
    - Maintain retry functionality
    - _Requirements: 3.2_

- [x] 8. Checkpoint - Make sure all tests are passing

  - Ensure all tests pass, ask the user if questions arise.

- [ ]\* 9. Write integration tests

  - [ ]\* 9.1 Write unit tests for token endpoint
    - Test authenticated requests return valid token
    - Test unauthenticated requests are rejected
    - _Requirements: 2.3_
  - [ ]\* 9.2 Write unit tests for streaming utilities
    - Test specific event types map to expected status text
    - Test edge cases (empty tool names, unknown events)
    - _Requirements: 1.2, 1.3, 1.4_

- [x] 10. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.
