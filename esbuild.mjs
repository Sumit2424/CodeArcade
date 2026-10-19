// Bundles the VS Code extension host code (Node, CommonJS) into dist/.
// The webview is bundled separately by Vite (see vite.config.ts).
import { build, context } from 'esbuild';

const watch = process.argv.includes('--watch');
const production = process.argv.includes('--production');

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: {
    extension: 'src/extension/extension.ts',
    // Standalone script that Claude Code runs; it is copied to ~/.code-arcade/ when enabled.
    hook: 'src/extension/adapters/claude-code/hook.ts',
  },
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['vscode'],
  sourcemap: !production,
  minify: production,
  logLevel: 'info',
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
} else {
  await build(options);
}
