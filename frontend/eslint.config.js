import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'

export default [
  {
    ignores: ['node_modules/**', 'dist/**']
  },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser
    },
    settings: {
      react: {
        version: '18.3'
      }
    }
  },
  {
    files: ['vite.config.js'],
    languageOptions: {
      globals: globals.node
    }
  }
]