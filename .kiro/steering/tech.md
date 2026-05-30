# Tech Stack

## Core Technologies

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS v4 with CSS variables
- **UI Components**: shadcn/ui (New York style)
- **Authentication**: Clerk
- **Backend/Database**: Convex
- **State Management**: React 19 with hooks
- **Icons**: Lucide React
- **Theming**: next-themes (default: dark mode)

## Key Libraries

- **Forms**: react-hook-form with zod validation
- **UI Primitives**: Radix UI components
- **Notifications**: Sonner (toast notifications)
- **Charts**: Recharts
- **Date Handling**: date-fns with react-day-picker
- **Utilities**: clsx, tailwind-merge, class-variance-authority

## Package Manager

- **pnpm** (lockfile: pnpm-lock.yaml)

## Common Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Production
pnpm start

# Linting
pnpm lint
```

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_CONVEX_URL` - Convex backend URL
- `CLERK_JWT_ISSUER_DOMAIN` - Clerk JWT issuer for Convex auth

## Path Aliases

- `@/*` - Root directory
- `@/components` - Components directory
- `@/lib` - Library utilities
- `@/hooks` - Custom React hooks
- `@/components/ui` - UI components
