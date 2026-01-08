import { ButtonHTMLAttributes, forwardRef } from 'react';
import { radius, transitions, typography } from '@/lib/design-tokens';

type ButtonVariant = 'primary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--color-primary)] 
    text-[var(--color-surface)] 
    hover:opacity-90 
    active:opacity-80 
    focus:ring-[var(--color-primary)]
  `,
  outline: `
    border-2 
    border-[var(--color-primary)] 
    text-[var(--color-primary)] 
    hover:bg-[var(--color-primary)/10] 
    active:bg-[var(--color-primary)/20] 
    focus:ring-[var(--color-primary)]
  `,
  ghost: `
    text-[var(--color-primary)] 
    hover:bg-[var(--color-primary)/10] 
    active:bg-[var(--color-primary)/20] 
    focus:ring-[var(--color-primary)]
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: `px-3 py-1.5 text-sm`,
  md: `px-4 py-2 text-base`,
  lg: `px-6 py-3 text-lg`,
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, loading, ...props }, ref) => {
    const baseStyles = `
      inline-flex 
      items-center 
      justify-center 
      font-medium 
      rounded-[${radius.md}] 
      transition-all 
      duration-[${transitions.normal}] 
      focus:outline-none 
      focus:ring-2 
      focus:ring-offset-2 
      disabled:opacity-50 
      disabled:cursor-not-allowed
    `;

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className={`w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin`} />
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
