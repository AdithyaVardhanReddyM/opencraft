import { Doc } from "@/convex/_generated/dataModel";

export type ProjectSortOption =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "modified";

type Project = Doc<"projects">;

/**
 * Sorts an array of projects based on the specified sort option
 * @param projects - Array of projects to sort
 * @param sortOption - Sort option to apply
 * @returns Sorted array of projects
 */
export function sortProjects(
  projects: Project[],
  sortOption: ProjectSortOption
): Project[] {
  const sorted = [...projects];

  switch (sortOption) {
    case "newest":
      return sorted.sort((a, b) => b.createdAt - a.createdAt);

    case "oldest":
      return sorted.sort((a, b) => a.createdAt - b.createdAt);

    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));

    case "modified":
      return sorted.sort((a, b) => b.lastModified - a.lastModified);

    default:
      return sorted;
  }
}
