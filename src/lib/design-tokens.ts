// Design tokens for consistent styling across the application

// Colors
export const colors = {
  // Primary palette
  primary: {
    DEFAULT: 'var(--color-primary, #0f172a)',
    light: '#334155',
    dark: '#020617',
  },
  secondary: {
    DEFAULT: 'var(--color-secondary, #c0a062)',
    light: '#d4b876',
    dark: '#a3884f',
  },
  // Semantic colors
  background: 'var(--color-background, #f8fafc)',
  surface: 'var(--color-surface, #ffffff)',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#3b82f6',
};

// Spacing scale
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

// Border radius
export const radius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

// Transitions
export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};

// Typography
export const typography = {
  fontFamily: {
    sans: 'var(--font-inter, system-ui, sans-serif)',
    serif: 'var(--font-playfair, Georgia, serif)',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.75',
  },
};

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Z-index scale
export const zIndex = {
  base: '0',
  dropdown: '1000',
  sticky: '1100',
  modal: '1200',
  popover: '1300',
  tooltip: '1400',
};

// Utility functions
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Create button variant classes
export function getButtonVariantStyles(variant: 'primary' | 'outline' | 'ghost') {
  const variants = {
    primary: `
      bg-[var(--color-primary)] 
      text-[var(--color-surface)] 
      hover:opacity-90 
      active:opacity-80
    `,
    outline: `
      border-2 
      border-[var(--color-primary)] 
      text-[var(--color-primary)] 
      hover:bg-[var(--color-primary)/10]
      active:bg-[var(--color-primary)/20]
    `,
    ghost: `
      text-[var(--color-primary)] 
      hover:bg-[var(--color-primary)/10]
      active:bg-[var(--color-primary)/20]
    `,
  };
  return variants[variant];
}

// Create focus ring styles
export function getFocusRingStyles(color: string = 'var(--color-primary)') {
  return `
    focus:outline-none 
    focus:ring-2 
    focus:ring-offset-2 
    focus:ring-[${color}]
  `;
}

// Create card styles
export function getCardStyles(hoverable: boolean = false) {
  return `
    rounded-[${radius.lg}]
    bg-[var(--color-surface)]
    shadow-[${hoverable ? shadows.lg : shadows.sm}]
    transition-all 
    duration-[${transitions.normal}]
    ${hoverable ? 'hover:shadow-[${shadows.lg}] hover:-translate-y-1' : ''}
  `;
}
