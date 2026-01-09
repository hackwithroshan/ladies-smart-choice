
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Base URL resolution for dev and production
  // Prepend /api/ because all backend routes are registered under the /api prefix
  const baseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

  // If path already starts with /api or api, don't duplicate it
  if (cleanPath.startsWith('api/')) {
    const finalPath = cleanPath.replace('api/', '');
    return `${baseUrl}/${finalPath}`;
  }

  return `${baseUrl}/${cleanPath}`;
};
