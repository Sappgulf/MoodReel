import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import vitest from '@vitest/eslint-plugin';

const sharedRules = {
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
};

export default [
  {
    ignores: ['build/**', 'coverage/**', 'node_modules/**', 'public/**', 'scripts/**', 'e2e/**'],
  },
  js.configs.recommended,
  {
    files: ['vite.config.js', 'playwright.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: globals.nodeBuiltin,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        process: 'readonly',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'error',
      ...sharedRules,
    },
    settings: { react: { version: 'detect' } },
  },
  {
    files: ['src/**/*.{test,spec}.{js,jsx}', 'src/setupTests.js'],
    plugins: { vitest },
    languageOptions: {
      globals: { ...vitest.environments.env.globals, ...globals.browser },
    },
    rules: {
      ...vitest.configs.recommended.rules,
      ...sharedRules,
    },
  },
];
