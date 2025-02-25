// Custom build script to work around WebCrypto issues in GitHub Actions
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting custom build process...');

// Find the Vite dependency path
const vitePath = path.resolve(__dirname, 'node_modules/vite');
console.log(`Vite path: ${vitePath}`);

// Path to the file that uses crypto.getRandomValues
const configFilePath = path.resolve(vitePath, 'dist/node/chunks/dep-CHZK6zbr.js');

if (fs.existsSync(configFilePath)) {
  console.log(`Found Vite config file: ${configFilePath}`);
  
  // Read the file content
  let content = fs.readFileSync(configFilePath, 'utf8');
  
  // Check if the file contains the problematic code
  if (content.includes('crypto.getRandomValues')) {
    console.log('Found crypto.getRandomValues usage, patching...');
    
    // Replace the crypto.getRandomValues with a simple implementation
    // that doesn't rely on WebCrypto
    content = content.replace(
      /crypto\.getRandomValues\([^)]+\)/g,
      'Buffer.from(Array(16).fill(0).map(() => Math.floor(Math.random() * 256)))'
    );
    
    // Write the patched file back
    fs.writeFileSync(configFilePath, content, 'utf8');
    console.log('Successfully patched Vite to avoid WebCrypto dependency');
  } else {
    console.log('No crypto.getRandomValues usage found in the file');
  }
} else {
  console.log(`Could not find Vite config file: ${configFilePath}`);
}

// Run the actual build command
console.log('Running Vite build...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
