# Project Structure

## Directory Organization

```
/app                    - Next.js App Router pages and layouts
  /(auth)              - Authentication routes (route group)
    /sign-in           - Sign in page with Clerk
    /sign-up           - Sign up page with Clerk
    layout.tsx         - Auth layout (centered, gray background)
  /dashboard           - Dashboard page
  layout.tsx           - Root layout with providers
  page.tsx             - Home page
  globals.css          - Global styles and Tailwind imports

/components            - React components
  /ui                  - shadcn/ui components (accordion, button, card, etc.)
  ConvexClientProvider.tsx - Convex + Clerk integration
  theme-provider.tsx   - Dark/light theme provider

/convex                - Convex backend
  /_generated          - Auto-generated Convex types and API
  auth.config.ts       - Clerk authentication configuration

/hooks                 - Custom React hooks
  use-mobile.ts        - Mobile detection hook

/lib                   - Utility functions
  utils.ts             - Utility helpers (cn function for class merging)

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
          └─ App Content
          └─ Toaster (notifications)
```

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
