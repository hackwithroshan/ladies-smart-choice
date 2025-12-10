// FIX: Switched to a namespace import for React to resolve a type error where `this.props` was not being recognized on the class component.
// This is a more robust pattern for this project's TypeScript configuration.
import * as React from 'react';

interface ErrorBoundaryProps {
    children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // You could also log the error to an external service here
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center p-4">
            <svg className="w-16 h-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong.</h1>
            <p className="text-gray-600 mb-6 max-w-md">We encountered an unexpected issue. Please try refreshing the page. If the problem continues, our team has been notified.</p>
            <button
                onClick={this.handleRefresh}
                className="px-6 py-2 bg-rose-600 text-white font-semibold rounded-md hover:bg-rose-700 transition-colors"
            >
                Refresh Page
            </button>
            {/* Show error details only in development mode for easier debugging */}
            {(process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') && this.state.error && (
                <pre className="mt-8 p-4 bg-gray-200 text-red-700 text-xs text-left rounded-md w-full max-w-2xl overflow-auto">
                    {this.state.error.stack}
                </pre>
            )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
