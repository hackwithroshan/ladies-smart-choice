
export const getApiUrl = (path: string): string => {
  // Production environment check
  const isProduction = (import.meta as any).env.PROD;
  
  // Clean the path
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const apiPath = cleanPath.startsWith('api/') ? cleanPath : `api/${cleanPath}`;

  if (isProduction) {
    // If we are on production, use the current domain's /api endpoint
    // This prevents ERR_CERT_COMMON_NAME_INVALID by keeping requests on the same domain
    return `/${apiPath}`;
  }

  // Development fallback (Vite proxy handles /api to port 5000/5001)
  return `/${apiPath}`;
};
