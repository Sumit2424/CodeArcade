import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

// The webview is served by VS Code from dist/webview with fixed file names
// (no content hashes) so the extension host can reference them directly.
// `npm run dev:web` serves src/webview/index.html in a normal browser.
export default defineConfig({
  root: resolve(root, 'src/webview'),
  base: './',
  plugins: [react()],
  build: {
    outDir: resolve(root, 'dist/webview'),
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: false,
    rollupOptions: {
      input: resolve(root, 'src/webview/main.tsx'),
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: 'chunk-[name].js',
        assetFileNames: (asset) =>
          asset.names.some((name) => name.endsWith('.css'))
            ? 'index.css'
            : 'assets/[name][extname]',
      },
    },
  },
});
