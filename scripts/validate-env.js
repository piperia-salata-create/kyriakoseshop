#!/usr/bin/env node

/**
 * Environment Validation Script
 * Run this script before building to ensure all required environment variables are set.
 * 
 * Usage: node scripts/validate-env.js
 */

const fs = require('fs');
const path = require('path');

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
    if (!value) {
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
    if (!value) {
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
    console.log('\nPlease set the required environment variables and try again.');
    console.log('Copy .env.local.example to .env.local and fill in the values, or create a .env.local file with your environment variables.\n');
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

// Run validation
validateEnv();
