
/**
 * A simplified version of the 'cn' utility that does not rely on external 
 * dependencies like tailwind-merge or clsx, resolving local build errors.
 */
export function cn(...inputs: any[]) {
  return inputs
    .flat(Infinity)
    .filter(Boolean)
    .join(' ');
}
