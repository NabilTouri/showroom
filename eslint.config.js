import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'test-results', 'playwright-report']),
  js.configs.recommended,
  tseslint.configs.recommended,
  { languageOptions: { globals: globals.browser } },
  {
    files: ['tools/**', '*.config.{js,ts}', 'tests/**'],
    languageOptions: { globals: globals.node },
  },
  prettier,
]);
