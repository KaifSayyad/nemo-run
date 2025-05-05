import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch and handle errors gracefully
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console or an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    // Reset the error state and try again
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but an error occurred in the game. Please try again.</p>
          {import.meta.env.DEV && this.state.error && (
            <div className="error-details">
              <h3>Error Details (Development Only):</h3>
              <pre>{this.state.error.toString()}</pre>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </div>
          )}
          <button 
            className="restart-button"
            onClick={this.handleReset}
          >
            Try Again
          </button>
        </div>
      );
    }

    // Normal render when no error
    return this.props.children;
  }
}

export default ErrorBoundary;

