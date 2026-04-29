import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import vitest from 'eslint-plugin-vitest';

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
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
    settings: { react: { version: 'detect' } },
  },
  {
    files: ['src/**/*.test.js', 'src/setupTests.js'],
    ...vitest.configs.recommended,
    languageOptions: {
      ...vitest.configs.recommended.languageOptions,
      globals: {
        ...vitest.configs.env.languageOptions.globals,
        ...globals.browser,
      },
    },
    rules: {
      ...vitest.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
