import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import jest from 'eslint-plugin-jest'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-plugin-prettier'

import { defineConfig } from 'eslint/config'

export default defineConfig([
  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    plugins: {
      import: importPlugin,
      prettier,
    },

    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'arrow-body-style': ['error', 'as-needed'],
      'import/no-duplicates': 'error',
      // the kernel knows no I/O: logging is an effect the host handles
      'no-console': 'error',
      'prettier/prettier': 'error',
    },
  },

  {
    files: ['**/*.spec.ts'],

    ...jest.configs['flat/recommended'],

    plugins: {
      jest,
    },

    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },

  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
  },
])
