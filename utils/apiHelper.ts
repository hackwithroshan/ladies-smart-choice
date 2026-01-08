
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Prepend /api/ because all backend routes are registered under the /api prefix
  // Example: 'products' becomes '/api/products'
  return `/api/${cleanPath}`;
};
