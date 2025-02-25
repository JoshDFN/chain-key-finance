// Custom build script to work around WebCrypto issues in GitHub Actions
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting custom build process...');

// Create a polyfill file for crypto.getRandomValues
const polyfillPath = path.resolve(__dirname, 'crypto-polyfill.js');
fs.writeFileSync(
  polyfillPath,
  `
// Polyfill for crypto.getRandomValues in Node.js environments
import * as nodeCrypto from 'crypto';

if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.getRandomValues !== 'function') {
  globalThis.crypto = {
    getRandomValues(array) {
      const bytes = nodeCrypto.randomBytes(array.length);
      for (let i = 0; i < bytes.length; i++) {
        array[i] = bytes[i];
      }
      return array;
    }
  };
}
`,
  'utf8'
);

console.log('Created crypto polyfill file');

// Find all Vite dependency files that might use crypto.getRandomValues
const vitePath = path.resolve(__dirname, 'node_modules/vite');
console.log(`Vite path: ${vitePath}`);

// Create a temporary build script that uses the polyfill
const tempBuildScriptPath = path.resolve(__dirname, 'temp-build.js');
fs.writeFileSync(
  tempBuildScriptPath,
  `
// Temporary build script with crypto polyfill
import './crypto-polyfill.js';
import { build } from 'vite';

// Patch global.crypto for Node.js environment
import * as nodeCrypto from 'crypto';

if (typeof global.crypto === 'undefined' || typeof global.crypto.getRandomValues !== 'function') {
  global.crypto = {
    getRandomValues(array) {
      const bytes = nodeCrypto.randomBytes(array.length);
      for (let i = 0; i < bytes.length; i++) {
        array[i] = bytes[i];
      }
      return array;
    }
  };
}

// Run the Vite build
try {
  await build();
  console.log('Build completed successfully');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
`,
  'utf8'
);

console.log('Created temporary build script');

// Run the temporary build script
console.log('Running build with crypto polyfill...');
try {
  execSync('node temp-build.js', { stdio: 'inherit' });
  console.log('Build completed successfully');
  
  // Clean up temporary files
  fs.unlinkSync(polyfillPath);
  fs.unlinkSync(tempBuildScriptPath);
} catch (error) {
  console.error('Build failed:', error);
  
  // Clean up temporary files even if build fails
  try {
    fs.unlinkSync(polyfillPath);
    fs.unlinkSync(tempBuildScriptPath);
  } catch (cleanupError) {
    console.error('Error cleaning up temporary files:', cleanupError);
  }
  
  process.exit(1);
}
