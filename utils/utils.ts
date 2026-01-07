/**
 * Standard utility to merge tailwind classes without external dependencies
 * to avoid "Failed to resolve" errors in certain environments.
 */
export function cn(...inputs: any[]) {
  return inputs
    .flat()
    .filter(Boolean)
    .join(" ");
}