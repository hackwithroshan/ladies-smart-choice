export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const apiPath = cleanPath.startsWith('api/') ? cleanPath : `api/${cleanPath}`;

  // Use relative path in production so it stays on the same domain/SSL
  if ((import.meta as any).env?.PROD) {
    return `/${apiPath}`;
  }

  // Development (Vite Proxy to 5000)
  return `/${apiPath}`;
};