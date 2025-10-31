#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'generate';
const projectRoot = args[1] || process.cwd();

const commands = {
  generate: 'generate-favicon.js',
  test: 'test-favicon.js',
  help: null
};

function showHelp() {
  console.log(`
favicon-fish - Independent Favicon Generator
============================================

Usage:
  favicon-fish <command> [project-path]

Commands:
  generate [path]   Generate favicon from mascot image (default)
  test [path]       Test the generated favicon
  help              Show this help message

Environment Variables:
  PROJECT_ROOT      Set the project root directory (can be overridden by CLI argument)

Examples:
  favicon-fish generate ~/my-project
  favicon-fish test .
  PROJECT_ROOT=. favicon-fish generate

Project Structure Expected:
  project-root/
  ├── src/
  │   └── assets/
  │       └── mascot.png
  └── public/
      └── (generated favicons will be placed here)
  `);
}

function runScript(scriptName, projectPath) {
  const scriptPath = path.join(__dirname, scriptName);
  
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Script not found: ${scriptPath}`);
    process.exit(1);
  }

  const child = spawn('node', [scriptPath, projectPath], {
    stdio: 'inherit',
    env: { ...process.env, PROJECT_ROOT: projectPath }
  });

  child.on('exit', (code) => {
    process.exit(code);
  });

  child.on('error', (error) => {
    console.error('❌ Error running script:', error.message);
    process.exit(1);
  });
}

// Main
if (command === 'help' || command === '-h' || command === '--help') {
  showHelp();
} else if (commands[command]) {
  runScript(commands[command], projectRoot);
} else {
  console.error(`❌ Unknown command: ${command}`);
  console.error(`Run 'favicon-fish help' for usage information`);
  process.exit(1);
}