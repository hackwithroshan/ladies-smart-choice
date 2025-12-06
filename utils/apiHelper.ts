
export const getApiUrl = (path: string): string => {
  // This helper ensures all API calls are correctly prefixed with '/api/'.
  // In development, this is handled by the Vite proxy.
  // In production, this is handled by Nginx or another reverse proxy.
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // If the path already includes the '/api' prefix, return it as is.
  if (cleanPath.startsWith('api/')) {
    return `/${cleanPath}`;
  }

  // Otherwise, prepend '/api/' to the path.
  return `/api/${cleanPath}`;
};
