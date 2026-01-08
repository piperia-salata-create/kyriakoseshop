#!/usr/bin/env node

/**
 * Pre-Deployment Verification Script
 * Runs all checks before deployment:
 * 1. Environment validation
 * 2. Type checking
 * 3. Linting
 * 4. Build verification
 * 
 * Usage: node scripts/pre-deploy.js
 */

import { execSync } from 'child_process';
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
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + colors.bold + '='.repeat(60) + colors.reset);
  log(title, 'cyan');
  console.log(colors.bold + '='.repeat(60) + colors.reset + '\n');
}

function logStep(step, status, duration = null) {
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '○';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  const durationStr = duration ? ` (${duration}ms)` : '';
  log(`  ${icon} ${step}${durationStr}`, color);
}

function runCommand(command, description) {
  const start = Date.now();
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    const duration = Date.now() - start;
    logStep(description, 'pass', duration);
    return { success: true, duration };
  } catch (error) {
    const duration = Date.now() - start;
    logStep(description, 'fail', duration);
    return { success: false, duration, error: error.message };
  }
}

async function preDeploy() {
  const results = {
    envValidation: null,
    typeCheck: null,
    lint: null,
    build: null,
  };

  logSection('PRE-DEPLOYMENT VERIFICATION');

  // Step 1: Environment Validation
  log('Step 1: Environment Validation');
  results.envValidation = runCommand('node scripts/validate-env.js', 'Environment Validation');
  if (!results.envValidation.success) {
    log('\n❌ Environment validation failed. Cannot proceed.', 'red');
    process.exit(1);
  }

  // Step 2: Type Checking
  log('\nStep 2: Type Checking (TypeScript)');
  results.typeCheck = runCommand('npm run type-check', 'Type Check');
  if (!results.typeCheck.success) {
    log('\n❌ Type checking failed. Fix the errors above.', 'red');
    process.exit(1);
  }

  // Step 3: Linting
  log('\nStep 3: Linting (ESLint)');
  results.lint = runCommand('npm run lint', 'Linting');
  if (!results.lint.success) {
    log('\n❌ Linting failed. Fix the errors above.', 'red');
    process.exit(1);
  }

  // Step 4: Build
  log('\nStep 4: Build (Next.js)');
  results.build = runCommand('npm run build', 'Build');

  // Summary
  logSection('DEPLOYMENT READY');

  const totalDuration = 
    (results.envValidation.duration || 0) +
    (results.typeCheck.duration || 0) +
    (results.lint.duration || 0) +
    (results.build.duration || 0);

  console.log(colors.bold + 'Check Results:' + colors.reset);
  console.log('  ✓ Environment Validation');
  console.log('  ✓ Type Checking');
  console.log('  ✓ Linting');
  console.log(`  ${results.build.success ? '✓' : '✗'} Build`);

  console.log('\n' + colors.bold + `Total Time: ${(totalDuration / 1000).toFixed(2)}s` + colors.reset);

  if (results.build.success) {
    log('\n✅ All checks passed! Ready for deployment.', 'green');
    process.exit(0);
  } else {
    log('\n❌ Build failed. Please fix the errors above.', 'red');
    process.exit(1);
  }
}

// Run pre-deployment checks
preDeploy().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
