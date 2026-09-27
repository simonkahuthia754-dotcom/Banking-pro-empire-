import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // required so the built assets load correctly inside the Capacitor WebView
  build: {
    outDir: 'dist',
  },
});
