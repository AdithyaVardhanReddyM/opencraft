# Project Structure

## Directory Organization

```
/app                    - Next.js App Router pages and layouts
  /(auth)              - Authentication routes (route group)
    /sign-in           - Sign in page with Clerk
    /sign-up           - Sign up page with Clerk
    layout.tsx         - Auth layout (centered, gray background)
  /api                 - API routes
    /chat              - Chat API endpoints
      route.ts         - Send message to AI agent
      /test            - Test endpoint
    /inngest           - Inngest webhook handler
    /realtime          - Realtime token endpoints (planned)
  /dashboard           - Dashboard pages
    /[projectId]       - Project-specific pages
      /canvas          - Canvas page for drawing and design
    page.tsx           - Dashboard home with project grid
  layout.tsx           - Root layout with providers
  page.tsx             - Home page
  globals.css          - Global styles and Tailwind imports

/components            - React components
  /ai-elements         - AI UI components library
    conversation.tsx   - Chat conversation container
    message.tsx        - Message rendering with markdown
    prompt-input.tsx   - Auto-resize input with submit
    loader.tsx         - AI thinking indicator
    code-block.tsx     - Syntax highlighted code
    reasoning.tsx      - Chain-of-thought display
    tool.tsx           - Tool execution visualization
    web-preview.tsx    - Iframe preview component
    (+ more)           - See directory for full list
  /canvas              - Canvas UI components
    /shapes            - Shape rendering components
      Frame.tsx, FramePreview.tsx
      Rectangle.tsx, RectanglePreview.tsx
      Ellipse.tsx, EllipsePreview.tsx
      Line.tsx, LinePreview.tsx
      Arrow.tsx, ArrowPreview.tsx
      Stroke.tsx, StrokePreview.tsx
      Screen.tsx, ScreenPreview.tsx
      Text.tsx
    /property-controls - Property control components
      ColorPicker.tsx
      StrokeTypeControl.tsx
      StrokeWidthControl.tsx
      CornerTypeControl.tsx
      FontFamilyControl.tsx
      TextAlignControl.tsx
      DimensionsControl.tsx
      FrameFillPicker.tsx
    AISidebar.tsx      - AI chat sidebar panel
    Toolbar.tsx        - Tool selection toolbar
    ZoomBar.tsx        - Zoom controls
    HistoryPill.tsx    - Undo/redo controls
    BoundingBox.tsx    - Selection bounds with resize handles
    SelectionBox.tsx   - Multi-select rectangle
    ShapePropertiesBar.tsx - Properties panel
    LayersSidebar.tsx  - Layer list
    SaveIndicator.tsx  - Auto-save status
    BackButton.tsx     - Navigation back to dashboard
    CanvasActions.tsx  - Canvas action buttons
    DeleteScreenModal.tsx - Screen deletion confirmation
  /dashboard           - Dashboard-specific components
    DashboardHeader.tsx
    ProjectsGrid.tsx
    ProjectCard.tsx
    NewProjectCard.tsx
    ProjectFilters.tsx
    CreateProjectDialog.tsx
    DeleteProjectDialog.tsx
    EmptyState.tsx
    LoadingSkeleton.tsx
  /ui                  - shadcn/ui components (50+ components)
  ConvexClientProvider.tsx - Convex + Clerk integration
  theme-provider.tsx   - Dark/light theme provider
  mode-toggle.tsx      - Theme toggle button

/contexts              - React Context providers
  CanvasContext.tsx    - Canvas state management (viewport + shapes)

/convex                - Convex backend
  /_generated          - Auto-generated Convex types and API
  auth.config.ts       - Clerk authentication configuration
  http.ts              - HTTP endpoints for Inngest workflow
  schema.ts            - Database schema (projects, screens, messages)
  projects.ts          - Project queries and mutations
  screens.ts           - Screen queries and mutations (+ internal)
  messages.ts          - Message queries and mutations (+ internal)

/inngest               - Inngest AgentKit AI workflow
  client.ts            - Inngest client configuration
  functions.ts         - Agent functions (runChatAgent, helloWorld)
  utils.ts             - Sandbox utilities, message formatting

/sandbox-templates     - E2B sandbox templates
  /nextjs              - Next.js sandbox template
    e2b.toml           - Template configuration (unitset-sandbox-v1)
    e2b.Dockerfile     - Sandbox Docker image
    compile_page.sh    - Startup script for dev server

/hooks                 - Custom React hooks
  use-infinite-canvas.ts - Main canvas interaction hook
  use-canvas-persistence.ts - Canvas state persistence (localStorage + Convex)
  use-canvas-cursor.ts - Cursor management based on tool/mode
  use-autosave.ts      - Autosave hook with debouncing
  use-mobile.ts        - Mobile detection hook

/lib                   - Utility functions
  /canvas              - Canvas-specific utilities
    coordinate-utils.ts - Screen/world coordinate conversion
    entity-adapter.ts  - Normalized entity state management
    hit-testing.ts     - Shape intersection detection
    persistence.ts     - Canvas state serialization
    shape-factories.ts - Shape creation with defaults
    shapes-reducer.ts  - Shapes state reducer
    viewport-reducer.ts - Viewport state reducer
    history-manager.ts - Undo/redo history management
    properties-utils.ts - Property presets and controls
    autosave-utils.ts  - Save status and conflict resolution
    layers-sidebar-utils.ts - Layer display utilities
    text-utils.ts      - Text measurement and dimensions
    cursor-utils.ts    - Cursor class mapping
    README.md          - Canvas architecture documentation
  date-utils.ts        - Date formatting utilities
  gradient-utils.ts    - Gradient generation utilities
  project-utils.ts     - Project-related utilities
  utils.ts             - General utility helpers (cn function, etc.)

/types                 - TypeScript type definitions
  canvas.ts            - Canvas types (shapes, viewport, tools)
  project.ts           - Project types

/public                - Static assets
```

## Architecture Patterns

### Route Groups

- Use parentheses for route groups that don't affect URL structure: `(auth)`

### Authentication Flow

- Clerk handles authentication UI and session management
- Convex integrates with Clerk via JWT tokens
- `ConvexProviderWithClerk` wraps the app to sync auth state

### Provider Hierarchy

```
ClerkProvider
  └─ ThemeProvider
      └─ ConvexClientProvider
          └─ CanvasProvider (on canvas pages)
              └─ App Content
              └─ Toaster (notifications)
```

### Canvas Architecture

- Canvas uses React Context + useReducer for state management
- Two separate reducers: viewport (pan/zoom) and shapes (drawing entities)
- Normalized entity state for shapes: `{ ids: string[], entities: Record<string, Shape> }`
- RAF throttling for performance optimization
- Auto-save to localStorage with 1-second debounce
- Custom DOM events for shape resizing
- See `canvas.md` for detailed architecture

### Data Model

**projects table:**

- User projects with canvas data, viewport state, metadata

**screens table:**

- AI-generated screen shapes with sandbox URL, files, sandboxId

**messages table:**

- Chat messages per screen with role and content

### Component Conventions

- UI components in `/components/ui` are from shadcn/ui
- AI components in `/components/ai-elements` for chat UI
- Use "use client" directive for client components
- Custom providers go in `/components` root
- Page components use Server Components by default

### Styling Approach

- Tailwind CSS with CSS variables for theming
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Component variants managed with class-variance-authority
- Default theme: dark mode with system preference support

### Type Safety

- Strict TypeScript configuration
- Convex generates types automatically in `/_generated`
- Use proper typing for all components and functions

### AI Workflow Architecture

- Inngest handles background job orchestration
- AgentKit provides agent network with tools
- E2B sandboxes run isolated Next.js environments with auto-pause
- OpenRouter proxies AI model requests
- Convex HTTP endpoints for Inngest-to-database communication
- See `ai-workflow.md` for detailed architecture
