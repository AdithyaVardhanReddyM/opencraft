# Implementation Plan

- [x] 1. Create Convex backend queries and mutations

  - [x] 1.1 Create convex/projects.ts file with getAllProjects query

    - Implement authentication check using ctx.auth.getUserIdentity()
    - Query projects table filtered by userId with index
    - Return projects ordered by creation date descending
    - _Requirements: 1.1, 1.2, 7.2, 7.5, 7.6_

  - [x] 1.2 Implement createProject mutation

    - Add authentication validation
    - Validate project name length (1-100 characters)
    - Handle project counter logic for auto-incrementing projectNumber
    - Insert new project with required fields (userId, name, createdAt, lastModified, projectNumber, sketchesData)
    - Return the new project ID
    - _Requirements: 2.4, 7.3, 7.5, 7.6, 7.7_

  - [x] 1.3 Implement deleteProject mutation
    - Add authentication validation
    - Verify project exists and user owns the project
    - Delete the project from database
    - _Requirements: 3.4, 7.4, 7.5, 7.6, 7.7_

- [x] 2. Create utility functions and types

  - [x] 2.1 Create lib/date-utils.ts for relative time formatting

    - Implement formatRelativeTime function using date-fns
    - Handle "just now", "X minutes ago", "X hours ago", "X days ago" formats
    - _Requirements: 1.3_

  - [x] 2.2 Create lib/project-utils.ts for sorting logic

    - Implement sortProjects function with SortOption parameter
    - Handle all sort options: newest, oldest, name-asc, name-desc, modified
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 2.3 Create types/project.ts for TypeScript interfaces
    - Define ProjectSortOption type
    - Define CreateProjectInput interface
    - Export types from Convex generated types
    - _Requirements: 7.7_

- [x] 3. Build core UI components

  - [x] 3.1 Create components/dashboard/LoadingSkeleton.tsx

    - Build skeleton card component using Skeleton from shadcn/ui
    - Create grid layout matching ProjectsGrid (responsive columns)
    - Display 6-8 skeleton cards
    - _Requirements: 1.2, 6.1_

  - [x] 3.2 Create components/dashboard/EmptyState.tsx

    - Design centered layout with icon, heading, and description
    - Add "Create Project" CTA button
    - Use Lucide icon (FolderOpen or similar)
    - _Requirements: 1.4, 6.1_

  - [x] 3.3 Create components/dashboard/ProjectFilters.tsx
    - Build Select component with sort options
    - Implement onChange handler for sort selection
    - Style with proper spacing and labels
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.3_

- [x] 4. Implement project card and actions

  - [x] 4.1 Create components/dashboard/ProjectCard.tsx

    - Build Card layout with thumbnail, title, description, metadata
    - Add hover effects and transitions
    - Implement click handler for navigation (placeholder for now)
    - Display project number badge
    - Format dates using relative time utility
    - Add dropdown menu for actions
    - _Requirements: 1.3, 6.4, 6.5_

  - [x] 4.2 Create components/dashboard/DeleteProjectDialog.tsx
    - Build confirmation dialog using Dialog from shadcn/ui
    - Implement useMutation hook for deleteProject
    - Add useTransition for pending state
    - Handle success with toast notification
    - Handle errors with inline error display
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 5. Build project creation flow

  - [x] 5.1 Create components/dashboard/CreateProjectDialog.tsx
    - Build form with name and description fields using react-hook-form
    - Implement zod validation schema
    - Add useMutation hook for createProject
    - Use useTransition for pending state
    - Handle form submission with validation
    - Display inline errors for validation failures
    - Show toast notification on success
    - Keep dialog open on error with error message
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 6. Implement main grid and header

  - [x] 6.1 Create components/dashboard/ProjectsGrid.tsx

    - Implement useQuery hook for getAllProjects
    - Add local state for sort option
    - Create useMemo for sorted projects using utility function
    - Build responsive CSS grid layout (1/2/3/4 columns)
    - Handle loading state with LoadingSkeleton
    - Handle empty state with EmptyState
    - Handle error state with error message and retry
    - Map projects to ProjectCard components
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.5, 6.4_

  - [x] 6.2 Create components/dashboard/DashboardHeader.tsx
    - Build header layout with flexbox (logo, filters, create button)
    - Add unitset_fulllogo.svg with proper sizing (h-10)
    - Make logo clickable linking to home page
    - Include ProjectFilters component
    - Add "New Project" button with Plus icon
    - Implement responsive layout (stack on mobile, horizontal on desktop)
    - Pass sort state and handlers to ProjectFilters
    - Connect create button to CreateProjectDialog
    - _Requirements: 2.1, 4.1, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3_

- [x] 7. Update dashboard page

  - [x] 7.1 Update app/dashboard/page.tsx
    - Replace placeholder with full dashboard layout
    - Add DashboardHeader component
    - Add ProjectsGrid component in main container
    - Apply proper container styling (mx-auto, responsive padding)
    - Ensure min-h-screen for full height
    - _Requirements: 1.1, 6.1, 6.2, 6.3_

- [x] 8. Add optimistic updates and polish

  - [x] 8.1 Implement optimistic UI updates in ProjectsGrid

    - Use React 19's useOptimistic for create operations
    - Add optimistic delete with fade-out animation
    - Ensure smooth transitions for all mutations
    - _Requirements: 2.5, 3.5_

  - [x] 8.2 Add toast notifications using Sonner

    - Success toast for project creation
    - Success toast for project deletion
    - Error toasts for failed operations
    - _Requirements: 2.5, 2.6, 3.5, 3.6_

  - [x] 8.3 Implement session persistence for filter preferences

    - Store selected sort option in sessionStorage
    - Restore sort preference on page load
    - _Requirements: 4.6_

  - [ ]\* 8.4 Add accessibility improvements

    - Ensure proper ARIA labels on icon buttons
    - Add keyboard navigation support
    - Test with screen readers
    - Verify focus visible states
    - _Requirements: 6.6_

  - [ ]\* 8.5 Performance optimizations
    - Verify Server/Client component split
    - Check memoization of sorted lists
    - Test loading performance with many projects
    - _Requirements: 6.4_
