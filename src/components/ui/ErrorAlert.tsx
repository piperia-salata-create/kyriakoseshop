import { spacing, colors, radius } from '@/lib/design-tokens';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export default function ErrorAlert({ 
  title = 'Error', 
  message, 
  onDismiss,
  className = '' 
}: ErrorAlertProps) {
  return (
    <div
      className={`flex flex-col gap-[${spacing.sm}] p-[${spacing.md}] rounded-[${radius.lg}] ${className}`}
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: colors.error,
      }}
    >
      <div className="flex items-start justify-between gap-[${spacing.md}]">
        <div className="flex items-start gap-[${spacing.sm}]">
          {/* Error Icon */}
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          
          <div>
            {title && (
              <h3 className="font-medium text-sm">{title}</h3>
            )}
            <p 
              className="text-sm mt-[${spacing.xs}]"
              style={{ opacity: 0.9 }}
            >
              {message}
            </p>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded hover:opacity-70 transition-opacity"
            style={{ color: colors.error }}
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
