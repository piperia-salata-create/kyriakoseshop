'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const [errorId, setErrorId] = useState<string>('');

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
    
    // Generate a unique error ID for tracking
    const id = `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrorId(id);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8" 
      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
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
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>
        
        {errorId && (
          <p className="text-sm mb-6 opacity-60" style={{ color: 'var(--color-secondary)' }}>
            Error ID: {errorId}
          </p>
        )}
        
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>
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
