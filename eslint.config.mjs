import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * Module boundaries (see docs/architecture.md):
 *   shared    -> imports nothing from the other layers
 *   games     -> shared only
 *   webview   -> shared, games (never extension, never `vscode`)
 *   extension -> shared (never webview, never games)
 */
const forbid = (...groups) => ({
  'no-restricted-imports': [
    'error',
    { patterns: groups.map(([group, message]) => ({ group: [group].flat(), message })) },
  ],
});

const noVscode = ['vscode', 'The vscode API is only available in src/extension.'];

export default defineConfig(
  { ignores: ['dist', 'node_modules', 'coverage', '*.vsix'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: forbid(
      ['**/extension/**', 'shared must not depend on extension code.'],
      ['**/webview/**', 'shared must not depend on webview code.'],
      ['**/games/**', 'shared must not depend on game code.'],
      noVscode,
    ),
  },
  {
    files: ['src/games/**/*.{ts,tsx}'],
    rules: forbid(
      ['**/extension/**', 'Games must not depend on extension code.'],
      ['**/webview/**', 'Games must not depend on the webview UI.'],
      noVscode,
    ),
  },
  {
    files: ['src/webview/**/*.{ts,tsx}'],
    rules: forbid(
      ['**/extension/**', 'The webview talks to the extension via shared messages only.'],
      noVscode,
    ),
  },
  {
    files: ['src/extension/**/*.ts'],
    rules: forbid(
      ['**/webview/**', 'The extension talks to the webview via shared messages only.'],
      ['**/games/**', 'The extension host does not run games.'],
    ),
  },
  {
    files: ['**/*.mjs'],
    rules: { 'no-undef': 'off' },
  },
);
