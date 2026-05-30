# Requirements Document

## Introduction

This feature implements a comprehensive project management dashboard for Unit {set}, enabling users to view, create, delete, and filter their projects. The dashboard serves as the primary workspace entry point where authenticated users can manage their design-to-code projects with an intuitive, visually appealing interface.

## Glossary

- **Dashboard**: The main authenticated page where users manage their projects
- **Project**: A user-created workspace containing canvases for design-to-code work
- **Project Card**: A visual representation of a project in the dashboard grid
- **Filter System**: UI controls allowing users to sort and filter their project list
- **Convex Backend**: The serverless backend system handling data persistence and queries
- **Loading Skeleton**: Placeholder UI displayed while data is being fetched

## Requirements

### Requirement 1

**User Story:** As an authenticated user, I want to view all my projects on the dashboard, so that I can quickly access my work and see what projects I have created.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL retrieve all projects associated with the authenticated user from the Convex Backend
2. WHEN projects are being fetched, THE Dashboard SHALL display Loading Skeletons in a grid layout
3. WHEN projects are successfully loaded, THE Dashboard SHALL display each project as a Project Card in a responsive grid
4. WHEN no projects exist for the user, THE Dashboard SHALL display an empty state message with a call-to-action to create a project
5. WHEN a project fetch fails, THE Dashboard SHALL display an error message with retry option

### Requirement 2

**User Story:** As an authenticated user, I want to create new projects from the dashboard, so that I can start new design-to-code work.

#### Acceptance Criteria

1. THE Dashboard SHALL display a prominent create project button in the header area
2. WHEN the user clicks the create button, THE Dashboard SHALL display a dialog with a form for project details
3. THE Dashboard SHALL require a project name with minimum 1 character and maximum 100 characters
4. WHEN the user submits valid project data, THE Dashboard SHALL invoke a Convex mutation to create the project
5. WHEN project creation succeeds, THE Dashboard SHALL close the dialog and display the new Project Card in the grid
6. WHEN project creation fails, THE Dashboard SHALL display an error message within the dialog without closing it

### Requirement 3

**User Story:** As an authenticated user, I want to delete projects I no longer need, so that I can keep my dashboard organized and remove unwanted work.

#### Acceptance Criteria

1. THE Project Card SHALL display a delete action button or menu option
2. WHEN the user initiates deletion, THE Dashboard SHALL display a confirmation dialog to prevent accidental deletion
3. THE confirmation dialog SHALL clearly state which project will be deleted
4. WHEN the user confirms deletion, THE Dashboard SHALL invoke a Convex mutation to delete the project
5. WHEN deletion succeeds, THE Dashboard SHALL remove the Project Card from the grid with a smooth animation
6. WHEN deletion fails, THE Dashboard SHALL display an error notification and keep the Project Card visible

### Requirement 4

**User Story:** As an authenticated user, I want to filter and sort my projects, so that I can quickly find specific projects when I have many.

#### Acceptance Criteria

1. THE Dashboard SHALL display filter controls in the header area near the create button
2. THE Dashboard SHALL support sorting projects by creation date (newest first or oldest first)
3. THE Dashboard SHALL support sorting projects by last modified date
4. THE Dashboard SHALL support sorting projects alphabetically by name
5. WHEN the user changes filter or sort options, THE Dashboard SHALL reorder the Project Cards without a full page reload
6. THE Dashboard SHALL persist the selected filter preference in the browser session

### Requirement 5

**User Story:** As an authenticated user, I want to see the Unit {set} branding on the dashboard, so that I have a consistent brand experience throughout the application.

#### Acceptance Criteria

1. THE Dashboard SHALL display the unitset_fulllogo.svg in the top-left corner of the page
2. THE logo SHALL be sized appropriately for the header (height between 32px and 48px)
3. WHEN the user clicks the logo, THE Dashboard SHALL navigate to the home page
4. THE logo SHALL maintain proper contrast in both light and dark themes
5. THE logo SHALL be responsive and adjust appropriately on mobile viewports

### Requirement 6

**User Story:** As an authenticated user, I want the dashboard to have a clean, professional design without a sidebar, so that I can focus on my projects with maximum screen space.

#### Acceptance Criteria

1. THE Dashboard SHALL use a full-width layout without a sidebar component
2. THE Dashboard SHALL display a header with logo, filter controls, and create button
3. THE Dashboard SHALL use consistent spacing and visual hierarchy following the design system
4. THE Dashboard SHALL display Project Cards in a responsive grid (1 column on mobile, 2-3 columns on tablet, 3-4 columns on desktop)
5. THE Dashboard SHALL use appropriate shadows, borders, and rounded corners from the design system
6. THE Dashboard SHALL support both light and dark themes with proper color contrast

### Requirement 7

**User Story:** As a developer, I want Convex queries and mutations properly organized in a projects.ts file, so that the backend logic is maintainable and follows project conventions.

#### Acceptance Criteria

1. THE Convex Backend SHALL define a projects.ts file in the convex directory
2. THE projects.ts file SHALL export a query function to retrieve all projects for the authenticated user
3. THE projects.ts file SHALL export a mutation function to create a new project
4. THE projects.ts file SHALL export a mutation function to delete a project by ID
5. THE Convex Backend SHALL validate user authentication in all queries and mutations
6. THE Convex Backend SHALL ensure users can only access and modify their own projects
7. THE projects.ts file SHALL include proper TypeScript types for all function arguments and return values
