import { Doc, Id } from "@/convex/_generated/dataModel";

// Export Project type from Convex generated types
export type Project = Doc<"projects">;

// Export Project ID type
export type ProjectId = Id<"projects">;

// Sort options for project filtering
export type ProjectSortOption =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "modified";

// Input interface for creating a new project
export interface CreateProjectInput {
  name: string;
  description?: string;
}

// Filter state interface
export interface ProjectFilters {
  sortBy: ProjectSortOption;
}
