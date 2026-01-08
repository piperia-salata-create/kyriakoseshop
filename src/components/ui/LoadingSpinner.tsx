import { transitions } from '@/lib/design-tokens';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
};

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <span
      className={`inline-block rounded-full border-current border-t-transparent ${sizeMap[size]} ${className}`}
      style={{
        color: 'var(--color-primary)',
        animation: `spin ${transitions.normal} linear infinite`,
      }}
    />
  );
}

// Add keyframe animation via style tag
export function LoadingSpinnerStyles() {
  return (
    <style jsx global>{`
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `}</style>
  );
}
