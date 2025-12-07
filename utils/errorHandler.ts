// A custom error class to standardize API errors
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Parses an error from a fetch call
export async function handleApiError(error: any): Promise<ApiError> {
  // If it's already an ApiError, just return it
  if (error instanceof ApiError) {
    return error;
  }
  
  // If it's an error from a fetch Response object
  if (error instanceof Response) {
    const status = error.status;
    let data = null;
    try {
      data = await error.json();
    } catch (e) {
      // The body was not JSON, maybe just text
      try {
        data = { message: await error.text() };
      } catch (textErr) {
        // failed to get text body
        data = { message: 'Failed to parse error response.' };
      }
    }
    const message = data?.message || error.statusText || `Request failed with status ${status}`;
    return new ApiError(message, status, data);
  }

  // If it's a generic Error (e.g., network error)
  if (error instanceof Error) {
    return new ApiError(error.message, 0, { name: error.name });
  }

  // Fallback for unknown error types
  return new ApiError('An unexpected error occurred.', 0);
}

// Translates an ApiError into a user-friendly message
export function getFriendlyErrorMessage(error: ApiError): string {
  if (error.status === 0) {
    // Likely a network error or CORS issue
    if (error.message.includes('Failed to fetch')) {
        return 'Could not connect to the server. Please check your internet connection and try again.';
    }
    return `A network error occurred: ${error.message}`;
  }
  if (error.status >= 500) {
    // Server-side error
    return 'There was a problem on our end. Our team has been notified. Please try again in a few moments.';
  }
  if (error.status >= 400) {
    // Client-side error (like validation)
    // The message from the backend is often user-friendly enough
    return error.message || 'There was a problem with your request. Please check your input.';
  }
  
  // Fallback
  return error.message || 'An unknown error occurred.';
}
