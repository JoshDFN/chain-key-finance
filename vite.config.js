import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';

// Disable randomUUID usage in Vite which requires WebCrypto
process.env.VITE_DISABLE_UUID = 'true';

// Get canister IDs from dfx.json
const getDfxCanisterIds = () => {
  try {
    const dfxJson = JSON.parse(readFileSync(resolve('.', 'dfx.json'), 'utf8'));
    const network = process.env.DFX_NETWORK || 'local';
    
    // Create the directory and empty canister_ids.json file if it doesn't exist
    const canisterIdsPath = resolve('.', '.dfx', network, 'canister_ids.json');
    if (!existsSync(canisterIdsPath)) {
      const dir = dirname(canisterIdsPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(canisterIdsPath, '{}', 'utf8');
    }
    
    const canisterIds = JSON.parse(readFileSync(canisterIdsPath, 'utf8'));

    return Object.entries(dfxJson.canisters).reduce((acc, [name, _value]) => {
      const canisterId = canisterIds[name]?.[network];
      if (canisterId) {
        acc[name.toUpperCase() + '_CANISTER_ID'] = canisterId;
      }
      return acc;
    }, {});
  } catch (error) {
    console.warn('Warning: Could not get canister IDs from dfx.json', error);
    return {};
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Define environment variables for canister IDs
    'process.env.DFX_NETWORK': JSON.stringify(process.env.DFX_NETWORK || 'local'),
    ...Object.entries(getDfxCanisterIds()).reduce((acc, [key, value]) => {
      acc[`process.env.${key}`] = JSON.stringify(value);
      return acc;
    }, {}),
    // Define Internet Identity canister ID
    'process.env.INTERNET_IDENTITY_CANISTER_ID': JSON.stringify(
      process.env.INTERNET_IDENTITY_CANISTER_ID || 'asrmz-lmaaa-aaaaa-qaaeq-cai'
    ),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
