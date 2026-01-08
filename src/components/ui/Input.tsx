import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2 
            border rounded-md 
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-secondary)]'}
            ${className}
          `}
          style={{ 
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-primary)'
          }}
          {...props}
        />
        {error && (
          <span className="text-sm" style={{ color: '#ef4444' }}>{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
