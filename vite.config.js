import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  publicDir: path.resolve(__dirname, '../00 - data'), 
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm'], 
  },
});