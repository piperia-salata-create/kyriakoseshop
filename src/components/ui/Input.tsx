import { InputHTMLAttributes, forwardRef } from 'react';
import { radius, transitions, spacing, typography } from '@/lib/design-tokens';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-[${spacing.sm}]`}>
        {label && (
          <label 
            className={`text-sm font-medium`}
            style={{ color: 'var(--color-primary)' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full 
            px-[${spacing.md}] 
            py-[${spacing.sm}] 
            border 
            rounded-[${radius.md}] 
            transition-all 
            duration-[${transitions.normal}]
            focus:outline-none 
            focus:ring-2 
            focus:ring-[var(--color-primary)] 
            focus:border-transparent
            disabled:opacity-50 
            disabled:cursor-not-allowed
            ${error ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : 'border-[var(--color-secondary)]'}
            ${className}
          `}
          style={{ 
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-primary)',
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.sans,
          }}
          {...props}
        />
        {error && (
          <span 
            className="text-sm"
            style={{ color: 'var(--color-error)' }}
          >{error}</span>
        )}
        {helperText && !error && (
          <span 
            className="text-sm"
            style={{ color: 'var(--color-primary)', opacity: 0.7 }}
          >{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
