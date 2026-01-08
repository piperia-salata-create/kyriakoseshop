#!/usr/bin/env node

/**
 * Environment Validation Script
 * Run this script before building to ensure all required environment variables are set.
 * 
 * Usage: node scripts/validate-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

// Load .env.local if it exists
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
}

// Environment configurations
const envConfigs = {
  development: {
    required: ['NEXT_PUBLIC_WORDPRESS_URL'],
    optional: ['WC_CONSUMER_KEY', 'WC_CONSUMER_SECRET', 'NEXT_PUBLIC_SITE_URL', 'REVALIDATION_SECRET'],
  },
  staging: {
    required: ['NEXT_PUBLIC_WORDPRESS_URL', 'WC_CONSUMER_KEY', 'WC_CONSUMER_SECRET', 'NEXT_PUBLIC_SITE_URL'],
    optional: ['REVALIDATION_SECRET'],
  },
  production: {
    required: ['NEXT_PUBLIC_WORDPRESS_URL', 'WC_CONSUMER_KEY', 'WC_CONSUMER_SECRET', 'NEXT_PUBLIC_SITE_URL', 'REVALIDATION_SECRET'],
    optional: [],
  },
};

function getEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'staging') return 'staging';
  return 'development';
}

function validateEnv() {
  const env = getEnvironment();
  const config = envConfigs[env];
  const errors = [];
  const warnings = [];
  const passed = [];

  logSection(`Environment: ${env.toUpperCase()}`);

  // Check required variables
  for (const key of config.required) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      errors.push({ key, message: 'Required variable is not set' });
      log(`✗ ${key}`, 'red');
    } else {
      passed.push(key);
      log(`✓ ${key}`, 'green');
    }
  }

  // Check optional variables
  for (const key of config.optional) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      warnings.push(key);
      log(`△ ${key} (optional) - not set`, 'yellow');
    } else {
      passed.push(key);
      log(`✓ ${key}`, 'green');
    }
  }

  // Summary
  console.log('\n' + '-'.repeat(60));
  log(`Summary: ${passed.length} passed, ${errors.length} errors, ${warnings.length} warnings`, 
    errors.length > 0 ? 'red' : warnings.length > 0 ? 'yellow' : 'green');

  if (errors.length > 0) {
    console.log('\n');
    logSection('ERRORS - Build cannot proceed', 'red');
    for (const { key, message } of errors) {
      console.log(`  • ${key}: ${message}`);
    }
    console.log('\nPlease set the required environment variables in .env.local');
    console.log('Example:');
    console.log('  NEXT_PUBLIC_WORDPRESS_URL=https://your-woocommerce-store.com\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log('\n');
    logSection('WARNINGS - Some features may be limited', 'yellow');
    for (const key of warnings) {
      console.log(`  • ${key} - not set`);
    }
    console.log('\nThese variables are optional but recommended for full functionality.\n');
  }

  log('\n✓ Environment validation passed!', 'green');
  process.exit(0);
}

// Load environment variables first
loadEnvFile();

// Run validation
validateEnv();
