import { formatDistanceToNow } from "date-fns";

/**
 * Formats a timestamp into a relative time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted relative time string (e.g., "just now", "2 minutes ago", "3 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  // Just now (less than 1 minute)
  if (diffInSeconds < 60) {
    return "just now";
  }

  // Use date-fns for other cases
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}
