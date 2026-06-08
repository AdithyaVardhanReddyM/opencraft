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
  /dashboard           - Dashboard pages
    /[projectId]       - Project-specific pages
      /canvas          - Canvas page for drawing and design
    page.tsx           - Dashboard home with project grid
  layout.tsx           - Root layout with providers
  page.tsx             - Home page
  globals.css          - Global styles and Tailwind imports

/components            - React components
  /canvas              - Canvas UI components (toolbar, zoom bar, bounding box, etc.)
    /shapes            - Shape rendering components (Frame, Rectangle, Ellipse, etc.)
  /dashboard           - Dashboard-specific components (project cards, filters, etc.)
  /ui                  - shadcn/ui components (accordion, button, card, etc.)
  ConvexClientProvider.tsx - Convex + Clerk integration
  theme-provider.tsx   - Dark/light theme provider

/contexts              - React Context providers
  CanvasContext.tsx    - Canvas state management (viewport + shapes)

/convex                - Convex backend
  /_generated          - Auto-generated Convex types and API
  auth.config.ts       - Clerk authentication configuration
  projects.ts          - Project queries and mutations
  schema.ts            - Database schema

/inngest               - Inngest background functions
  client.ts            - Inngest client configuration
  functions.ts         - Agent functions (chat agent, etc.)

/hooks                 - Custom React hooks
  use-canvas.ts        - Canvas-related hooks (deprecated, use use-infinite-canvas)
  use-canvas-persistence.ts - Canvas state persistence (localStorage + Convex)
  use-infinite-canvas.ts - Main canvas interaction hook
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

### Component Conventions

- UI components in `/components/ui` are from shadcn/ui
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
