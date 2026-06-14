/**
 * Theme utilities for screen shapes
 * Provides theme definitions and commands for applying themes to sandboxes
 */

export interface ThemeDefinition {
  id: string;
  name: string;
  command: string;
  /** Preview colors: [primary, secondary, accent] */
  colors: [string, string, string];
}

/**
 * Default globals.css content for resetting to the default theme
 */
export const DEFAULT_GLOBALS_CSS = `@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;

export const THEMES: ThemeDefinition[] = [
  {
    id: "default",
    name: "Default",
    command: "",
    colors: ["oklch(0.205 0 0)", "oklch(0.97 0 0)", "oklch(0.97 0 0)"],
  },
  {
    id: "claude",
    name: "Claude",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/claude.json --yes",
    colors: ["#c96442", "#e9e6dc", "#e9e6dc"],
  },
  {
    id: "amber-minimal",
    name: "Amber Minimal",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/amber-minimal.json --yes",
    colors: ["#f59e0b", "#fffbeb", "#f3f4f6"],
  },
  {
    id: "amethyst-haze",
    name: "Amethyst Haze",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/amethyst-haze.json --yes",
    colors: ["#8a79ab", "#e6a5b8", "#dfd9ec"],
  },
  {
    id: "bold-tech",
    name: "Bold Tech",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/bold-tech.json --yes",
    colors: ["#8b5cf6", "#dbeafe", "#f3f0ff"],
  },
  {
    id: "bubblegum",
    name: "Bubblegum",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/bubblegum.json --yes",
    colors: ["#d04f99", "#fbe2a7", "#8acfd1"],
  },
  {
    id: "caffeine",
    name: "Caffeine",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/caffeine.json --yes",
    colors: ["#644a40", "#e8e8e8", "#ffdfb5"],
  },
  {
    id: "candyland",
    name: "Candyland",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/candyland.json --yes",
    colors: ["#ffc0cb", "#ffff00", "#87ceeb"],
  },
  {
    id: "catppuccin",
    name: "Catppuccin",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/catppuccin.json --yes",
    colors: ["#8839ef", "#04a5e5", "#ccd0da"],
  },
  {
    id: "claymorphism",
    name: "Claymorphism",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/claymorphism.json --yes",
    colors: ["#6366f1", "#f3e5f5", "#d6d3d1"],
  },
  {
    id: "clean-slate",
    name: "Clean Slate",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/clean-slate.json --yes",
    colors: ["#6366f1", "#e0e7ff", "#e5e7eb"],
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/cyberpunk.json --yes",
    colors: ["#ff00c8", "#00ffcc", "#f0f0ff"],
  },
  {
    id: "neo-brutalism",
    name: "Neo Brutalism",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/neo-brutalism.json --yes",
    colors: ["#ff3333", "#0066ff", "#ffff00"],
  },
  {
    id: "supabase",
    name: "Supabase",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/supabase.json --yes",
    colors: ["#72e3ad", "#ededed", "#fdfdfd"],
  },
  {
    id: "t3-chat",
    name: "T3 Chat",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/t3-chat.json --yes",
    colors: ["#a84370", "#f1c4e6", "#f1c4e6"],
  },
  {
    id: "twitter",
    name: "Twitter",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/twitter.json --yes",
    colors: ["#1e9df1", "#E3ECF6", "#0f1419"],
  },
  {
    id: "vercel",
    name: "Vercel",
    command:
      "npx shadcn@latest add https://tweakcn.com/r/themes/vercel.json --yes",
    colors: ["oklch(0 0 0)", "oklch(0.94 0 0)", "oklch(0.94 0 0)"],
  },
];

export function getThemeById(id: string): ThemeDefinition | undefined {
  return THEMES.find((t) => t.id === id);
}

export function getThemeCommand(themeId: string): string {
  const theme = getThemeById(themeId);
  return theme?.command || "";
}
