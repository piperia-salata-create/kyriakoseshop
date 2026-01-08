'use client';

import { Component, ReactNode, ErrorInfo, useState } from 'react';
import Button from './ui/Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorId: '',
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorId: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="min-h-screen flex items-center justify-center p-8" 
          style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}
        >
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <svg 
                className="mx-auto h-16 w-16" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                style={{ color: '#ef4444' }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
            
            <p className="mb-6 opacity-80">
              We encountered an unexpected error. Please try again.
            </p>
            
            {this.state.errorId && (
              <p className="text-sm mb-6 opacity-60" style={{ color: 'var(--color-secondary)' }}>
                Error ID: {this.state.errorId}
              </p>
            )}
            
            <div className="flex gap-4 justify-center">
              <Button onClick={this.resetError}>
                Try Again
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Async error handler hook for handling promises and async operations
export function useAsyncError() {
  const [, setError] = useState<Error | null>(null);

  return (error: Error) => {
    setError(() => {
      throw error;
    });
  };
}
