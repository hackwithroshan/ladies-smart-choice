
export const getApiUrl = (path: string): string => {
  // Check if we are in production (on Vercel)
  const isProduction = import.meta.env.PROD;
  
  // Get backend URL from environment or default to current origin (for local dev)
  // On Vercel, you must set VITE_API_URL in your project settings.
  const baseUrl = import.meta.env.VITE_API_URL || '';

  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const apiPath = cleanPath.startsWith('api/') ? cleanPath : `api/${cleanPath}`;

  // If baseUrl is provided (like Railway URL), return absolute URL
  if (baseUrl) {
    return `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${apiPath}`;
  }

  // Fallback for local development or same-server hosting
  return `/${apiPath}`;
};
