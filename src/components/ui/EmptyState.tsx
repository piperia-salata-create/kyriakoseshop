import { spacing, typography, colors } from '@/lib/design-tokens';
import Link from 'next/link';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ 
  title, 
  description, 
  action, 
  icon,
  className = '' 
}: EmptyStateProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center text-center p-[${spacing['2xl']}] ${className}`}
      style={{ 
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-primary)'
      }}
    >
      {icon && (
        <div 
          className="mb-[${spacing.md}]"
          style={{ color: 'var(--color-secondary)' }}
        >
          {icon}
        </div>
      )}
      
      <h2 
        className="text-xl font-semibold mb-[${spacing.sm}]"
        style={{ color: 'var(--color-primary)' }}
      >
        {title}
      </h2>
      
      {description && (
        <p 
          className="text-sm mb-[${spacing.lg}] max-w-md"
          style={{ 
            color: 'var(--color-primary)', 
            opacity: 0.7,
            fontSize: typography.fontSize.base,
            lineHeight: typography.lineHeight.normal
          }}
        >
          {description}
        </p>
      )}
      
      {action && (
        <div className="flex gap-[${spacing.md}]">
          {action.href ? (
            <Link href={action.href}>
              <Button variant="primary">{action.label}</Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
