// =====================================================
// ENVIRONMENT CONFIGURATION
// =====================================================
//
// This file defines and validates all environment variables
// used by the application. Variables are grouped by purpose
// and documented with their required environments.
//
// FAILURE TO SET REQUIRED VARIABLES WILL CAUSE THE
// APPLICATION TO CRASH AT STARTUP.
// =====================================================

// =====================================================
// WOOCOMMERCONNECTION
// =====================================================
// Required for: All checkout and product operations
// Purpose: Connect to WooCommerce REST API
//
// NEXT_PUBLIC_WORDPRESS_URL
//   - The base URL of the WordPress/WooCommerce site
//   - Format: https://example.com
//   - Required in: all environments
//
// WC_CONSUMER_KEY
//   - WooCommerce REST API consumer key
//   - Generate in: WooCommerce > Settings > Advanced > REST API
//   - Required in: staging, production
//   - Optional in: development (warnings will be shown)
//
// WC_CONSUMER_SECRET
//   - WooCommerce REST API consumer secret
//   - Generate in: WooCommerce > Settings > Advanced > REST API
//   - Required in: staging, production
//   - Optional in: development (warnings will be shown)
// =====================================================

// =====================================================
// SITE CONFIGURATION
// =====================================================
// Required for: SEO, OpenGraph, canonical URLs
//
// NEXT_PUBLIC_SITE_URL
//   - The public URL of this e-commerce site
//   - Format: https://example.com
//   - Required in: staging, production
//   - Optional in: development
// =====================================================

// =====================================================
// REVALIDATION
// =====================================================
// Required for: On-demand ISR revalidation webhook
//
// REVALIDATION_SECRET
//   - Secret token for the revalidation webhook endpoint
//   - Used to verify incoming revalidation requests
//   - Required in: production
//   - Optional in: development, staging
// =====================================================

// =====================================================
// ENVIRONMENT DEFINITIONS
// =====================================================

export type Env = 'development' | 'staging' | 'production';

interface EnvConfig {
  required: string[];
  optional: string[];
}

const envConfigs: Record<Env, EnvConfig> = {
  development: {
    // WooCommerce connection - URL required for any product/cart operations
    required: [
      'NEXT_PUBLIC_WORDPRESS_URL',
    ],
    // API credentials - warn if missing (may work with limited functionality)
    optional: [
      'WC_CONSUMER_KEY',
      'WC_CONSUMER_SECRET',
      // Site configuration
      'NEXT_PUBLIC_SITE_URL',
      // Webhook authentication
      'REVALIDATION_SECRET',
    ],
  },
  staging: {
    // All WooCommerce variables required for testing
    required: [
      'NEXT_PUBLIC_WORDPRESS_URL',
      'WC_CONSUMER_KEY',
      'WC_CONSUMER_SECRET',
      'NEXT_PUBLIC_SITE_URL',
    ],
    // Webhook authentication
    optional: [
      'REVALIDATION_SECRET',
    ],
  },
  production: {
    // All variables required for production
    required: [
      'NEXT_PUBLIC_WORDPRESS_URL',
      'WC_CONSUMER_KEY',
      'WC_CONSUMER_SECRET',
      'NEXT_PUBLIC_SITE_URL',
      'REVALIDATION_SECRET',
    ],
    optional: [],
  },
};

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

// Get current environment
export function getEnvironment(): Env {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production') return 'production';
  // NODE_ENV may not be 'staging' in some environments, but we support it
  if ((process.env.NODE_ENV as string) === 'staging') return 'staging';
  return 'development';
}

// Validate environment variables
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const env = getEnvironment();
  const config = envConfigs[env];
  const errors: string[] = [];

  // Check required variables
  for (const key of config.required) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Warn about missing optional variables
  for (const key of config.optional) {
    if (!process.env[key]) {
      console.warn(`[${env}] Warning: Optional environment variable not set: ${key}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =====================================================
// STARTUP VALIDATION
// =====================================================
// Run validation immediately when this module is loaded.
// This ensures the application fails fast if required
// environment variables are missing.
// =====================================================

let _startupValidated = false;
let _startupValid = false;
let _startupErrors: string[] = [];

function runStartupValidation(): void {
  if (_startupValidated) return;
  
  const result = validateEnvironment();
  _startupValid = result.valid;
  _startupErrors = result.errors;
  _startupValidated = true;
  
  if (!_startupValid) {
    console.error('='.repeat(60));
    console.error('ENVIRONMENT VALIDATION FAILED');
    console.error('='.repeat(60));
    console.error('The following required environment variables are missing:');
    for (const error of _startupErrors) {
      console.error(`  - ${error}`);
    }
    console.error('='.repeat(60));
    console.error('Please set these variables before starting the application.');
    console.error('='.repeat(60));
    
    // In production, we crash immediately
    // In development, we continue but checkout will fail
    if (getEnvironment() === 'production') {
      process.exit(1);
    }
  } else {
    console.log(`[${getEnvironment()}] Environment validated successfully`);
  }
}

// Run validation at module load time
runStartupValidation();

// Validate at build/runtime
export function assertEnvironment(): void {
  // Re-run validation in case environment changed
  runStartupValidation();
  
  if (!_startupValid) {
    throw new Error(
      `Environment validation failed:\n${_startupErrors.join('\n')}\n\n` +
      `Please set the required environment variables before building.`
    );
  }
}

// =====================================================
// TYPE-SAFE ACCESSORS
// =====================================================

// Type-safe environment variable getter
export function getEnvVar(key: string, required: boolean = false): string | undefined {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(`Required environment variable not set: ${key}`);
  }
  
  return value;
}

// Public environment variables (exposed to browser)
export const publicEnv: Record<string, string | undefined> = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  wordpressUrl: process.env.NEXT_PUBLIC_WORDPRESS_URL,
};

// Server-only environment variables (for logging/debugging without exposing values)
export const serverEnv: Record<string, boolean> = {
  wcConsumerKeySet: !!process.env.WC_CONSUMER_KEY,
  wcConsumerSecretSet: !!process.env.WC_CONSUMER_SECRET,
  revalidationSecretSet: !!process.env.REVALIDATION_SECRET,
};
