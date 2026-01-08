# Kyriakos E-Shop Design System

## Design System Audit

### Color Palette
| Variable | Value | Usage |
|----------|-------|-------|
| `--color-primary` | `#0f172a` | Text, headings, primary elements |
| `--color-secondary` | `#c0a062` | Accents, prices, borders |
| `--color-background` | `#f8fafc` | Page backgrounds |
| `--color-surface` | `#ffffff` | Card/product backgrounds |

### Typography
| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Headings | Playfair Display | 600 | - | 1.2 |
| Body | Inter | 400 | - | 1.6 |
| Buttons | Inter | 500 | - | - |

### Spacing Scale
| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 0.25rem | Tight spacing |
| `--space-2` | 0.5rem | Inline elements |
| `--space-3` | 0.75rem | Between labels/inputs |
| `--space-4` | 1rem | Default gap |
| `--space-6` | 1.5rem | Component padding |
| `--space-8` | 2rem | Section spacing |

### Border Radius
| Component | Radius |
|-----------|--------|
| Buttons | `0.375rem` (6px) |
| Cards | `0.75rem` (12px) |
| Inputs | `0.375rem` (6px) |

### Shadow
| Component | Shadow |
|-----------|--------|
| Cards (default) | `0 1px 3px rgba(0,0,0,0.1)` |
| Cards (hover) | `0 10px 15px rgba(0,0,0,0.1)` |

### Transitions
| Property | Duration | Timing |
|----------|----------|--------|
| All | 200ms | ease-in-out |
| Hover effects | 300ms | ease-in-out |

---

## Component Status

### ✅ Button (src/components/ui/Button.tsx)
**Status:** Well-designed, reusable
- **Variants:** primary, outline, ghost
- **Sizes:** sm, md, lg
- **Consistent:** Uses CSS variables, proper focus states, disabled states
- **Missing:** Loading state prop

### ✅ Input (src/components/ui/Input.tsx)
**Status:** Well-designed, reusable
- **Features:** Label, error handling, disabled state
- **Consistent:** Uses CSS variables, proper focus ring
- **Missing:** Helper text prop

### ✅ ProductCard (src/components/ProductCard.tsx)
**Status:** Needs improvement
- **Issues:**
  - Uses inline styles instead of design tokens
  - Shadow and transform not in design system
  - No stock status indicator
- **Fixes needed:** Add hover states, consistent spacing

### ✅ AddToCartButton (src/components/AddToCartButton.tsx)
**Status:** Good, simple wrapper
- **Reuses:** Button component ✅
- **Features:** Uses cart context
- **Issues:** Hardcoded alert, no loading state

### ✅ CartIcon (src/components/CartIcon.tsx)
**Status:** Good, simple
- **Features:** Uses cart count from context
- **Consistent:** Uses CSS variables
- **Issues:** Fixed text, could be more flexible

---

## Inconsistencies Found

### 1. Spacing Inconsistencies
| Location | Padding |
|----------|---------|
| ProductCard | 1rem (16px) |
| Error boundary | 2rem (32px) |
| Cart page | 2rem (32px) |

**Recommendation:** Standardize on 1.5rem (24px) for component padding

### 2. Typography Inconsistencies
| Location | Font | Weight |
|----------|------|--------|
| Headings | Playfair Display | 600 ✅ |
| Product names | Playfair Display | 600 ❌ |
| Body text | Inter | 400 ✅ |

**Fix:** Product names should use Inter (sans-serif) for readability

### 3. Border Radius Inconsistencies
| Component | Radius |
|-----------|--------|
| Buttons | 6px ✅ |
| Cards | 12px |
| Inputs | 6px ✅ |

**Recommendation:** Standardize on 8px for consistency

### 4. Missing States
- No loading states on buttons
- No disabled styling on AddToCartButton
- No focus visible states on links
- No hover states on CartIcon

---

## Recommended Improvements

### 1. Design Tokens
Create a dedicated `src/lib/design-tokens.ts`:
```typescript
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

export const colors = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  background: 'var(--color-background)',
  surface: 'var(--color-surface)',
  error: '#ef4444',
};

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};
```

### 2. Component Enhancements
- Add loading prop to Button
- Add helperText prop to Input
- Add stock status badge to ProductCard
- Add skeleton loading state

### 3. Global Styles
- Standardize border radius to 8px
- Add focus-visible styles to all interactive elements
- Add consistent hover transitions
