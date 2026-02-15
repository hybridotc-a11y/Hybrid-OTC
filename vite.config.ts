import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/', // Ensures assets load correctly from the root
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Standard pathing
    },
  },
  build: {
    outDir: 'dist', // Confirms the folder name for Render
  }
});
