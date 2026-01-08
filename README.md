# Kyriakos E-Shop

A modern e-commerce store built with Next.js 15, WooCommerce, and TypeScript.

## Features

- 🛒 Full shopping cart functionality
- 💳 Checkout with order creation
- 📦 Inventory management with stock validation
- 🔄 Incremental Static Regeneration (ISR)
- 📊 SEO optimization with metadata and schema.org
- 🎨 Design system with reusable components
- 🔒 Environment-based configuration
- ✅ Pre-deployment verification

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **E-Commerce:** WooCommerce REST API
- **Deployment:** Vercel / Netlify

## Prerequisites

- Node.js 18+
- WooCommerce store with REST API access
- npm or yarn

## Environment Setup

### 1. Create Environment File

Create a `.env.local` file in the root directory:

```bash
# Environment: development | staging | production
NODE_ENV=development

# Public Variables (exposed to browser)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WORDPRESS_URL=https://your-woocommerce-store.com

# Server-Only Variables (never exposed to browser)
WC_CONSUMER_KEY=ck_your_consumer_key
WC_CONSUMER_SECRET=cs_your_consumer_secret
REVALIDATION_SECRET=your_secure_secret_key
```

### 2. WooCommerce API Setup

1. Go to WooCommerce > Settings > Advanced > REST API
2. Create new API key with Read/Write permissions
3. Copy the Consumer Key and Consumer Secret
4. Add to `.env.local`

### 3. Generate Revalidation Secret

Generate a secure random string:

```bash
# Linux/macOS
openssl rand -base64 32

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Min 0 -Max 255 }))
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server

# Build & Deployment
npm run build        # Run all checks and build for production
npm run pre-deploy   # Run pre-deployment checks only

# Verification
npm run validate-env # Validate environment variables
npm run type-check   # TypeScript type checking
npm run lint         # ESLint with strict rules

# Other
npm run start        # Start production server
```

## Deployment Flow

### 1. Pre-Deployment Checks

The build process automatically runs:

1. **Environment Validation** - Ensures required variables are set
2. **Type Checking** - TypeScript compilation check
3. **Linting** - ESLint with `--max-warnings 0`
4. **Build** - Next.js production build

### 2. Deployment Options

#### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Or connect your repository to Vercel for automatic deployments.

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Or connect your repository to Netlify for automatic deployments.

#### Manual Build

```bash
npm run build
npm run start
```

### 3. Webhook Setup (Optional)

For automatic cache revalidation on WooCommerce updates:

1. In WooCommerce > Settings > Advanced > Webhooks
2. Create webhook for `Product` resource (action: updated/deleted)
3. Set Delivery URL to: `https://your-site.com/api/revalidate?secret=YOUR_SECRET`
4. Save and test the webhook

## Environment Variables by Environment

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `NEXT_PUBLIC_WORDPRESS_URL` | Required | Required | Required |
| `WC_CONSUMER_KEY` | Optional | Required | Required |
| `WC_CONSUMER_SECRET` | Optional | Required | Required |
| `NEXT_PUBLIC_SITE_URL` | Optional | Required | Required |
| `REVALIDATION_SECRET` | Optional | Optional | Required |
| `NODE_ENV` | development | staging | production |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── cart/              # Cart page
│   ├── checkout/          # Checkout page
│   ├── product/[slug]/    # Product detail page
│   └── thank-you/         # Order confirmation
├── components/            # React components
│   └── ui/               # Design system components
├── context/              # React context providers
├── lib/                  # Utility functions
│   ├── design-tokens.ts  # Design system tokens
│   ├── errors.ts         # Error handling
│   ├── env.ts            # Environment utilities
│   ├── logger.ts         # Logging utilities
│   ├── schema.ts         # Schema.org structured data
│   ├── types.ts          # TypeScript types
│   └── woocommerce.ts    # WooCommerce API
└── ...
```

## Design System

### Components

- **Button** - Primary, outline, ghost variants with loading state
- **Input** - Form inputs with labels and error handling
- **LoadingSpinner** - Animated loading indicator
- **EmptyState** - Empty state with action
- **ErrorAlert** - Error messages with dismiss

### Design Tokens

See [`src/lib/design-tokens.ts`](src/lib/design-tokens.ts) for:
- Colors (primary, secondary, semantic)
- Spacing (8px grid scale)
- Typography (font sizes, weights)
- Shadows and transitions

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## License

MIT
