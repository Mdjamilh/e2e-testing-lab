import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import playwright from 'eslint-plugin-playwright'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'dist-e2e',
    'public/mockServiceWorker.js',
    'playwright-report',
    'test-results',
    'blob-report',
    'all-blob-reports',
  ]),
  {
    files: ['src/**/*.{ts,tsx}', '*.config.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    // The Playwright plugin flags the habits that make e2e suites flaky:
    // waitForTimeout, networkidle, element handles, focused tests and
    // assertions that do not auto-retry.
    files: ['e2e/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended, playwright.configs['flat/recommended']],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: {
      'playwright/expect-expect': [
        'error',
        {
          assertFunctionNames: ['expectNoViolations', 'expectLoaded', 'expectProducts', 'expectFieldError', 'expectCartCount'],
        },
      ],
      // Page objects expose methods like checkoutPage.fill(), which this rule mistakes for page.fill().
      'playwright/prefer-locator': 'off',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-networkidle': 'error',
    },
  },
])
