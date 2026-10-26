#!/usr/bin/env node
// Cross-platform replacement for `cp -r` in the build script.
// Windows cmd.exe has no `cp`, so we use Node's built-in fs.cpSync.
// Runs after `next build` to make the standalone output self-contained.

const fs = require('fs');

try {
  fs.cpSync('.next/static', '.next/standalone/.next/static', { recursive: true });
  fs.cpSync('public', '.next/standalone/public', { recursive: true });
  console.log('Standalone assets copied (.next/static, public).');
} catch (err) {
  console.error('Failed to copy standalone assets:', err.message);
  process.exit(1);
}
