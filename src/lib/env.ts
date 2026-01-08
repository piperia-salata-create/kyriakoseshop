// Environment validation utilities

export type Env = 'development' | 'staging' | 'production';

interface EnvConfig {
  required: string[];
  optional: string[];
}

const envConfigs: Record<Env, EnvConfig> = {
  development: {
    required: [
      'NEXT_PUBLIC_WORDPRESS_URL',
    ],
    optional: [
      'WC_CONSUMER_KEY',
      'WC_CONSUMER_SECRET',
      'NEXT_PUBLIC_SITE_URL',
      'REVALIDATION_SECRET',
    ],
  },
  staging: {
    required: [
      'NEXT_PUBLIC_WORDPRESS_URL',
      'WC_CONSUMER_KEY',
      'WC_CONSUMER_SECRET',
      'NEXT_PUBLIC_SITE_URL',
    ],
    optional: [
      'REVALIDATION_SECRET',
    ],
  },
  production: {
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
      console.warn(`Warning: Optional environment variable not set: ${key}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate at build time
export function assertEnvironment() {
  const { valid, errors } = validateEnvironment();
  
  if (!valid) {
    throw new Error(
      `Environment validation failed:\\n${errors.join('\\n')}\\n\\n` +
      `Please set the required environment variables before building.`
    );
  }
}

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

// Server-only environment variables
export const serverEnv: Record<string, string | undefined> = {
  wcConsumerKey: process.env.WC_CONSUMER_KEY,
  wcConsumerSecret: process.env.WC_CONSUMER_SECRET,
  revalidationSecret: process.env.REVALIDATION_SECRET,
};
