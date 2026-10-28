// ESLint 9 flat config。執行：npm install && npm run lint
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'dist/**', 'coverage/**'] },
  js.configs.recommended,
  {
    // 瀏覽器端程式（ES modules）
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      eqeqeq: ['warn', 'smart'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-shadow-restricted-names': 'error',
      // 全形空白（U+3000）在中日韓文案與註解中是刻意使用的，只在程式碼本體禁止
      'no-irregular-whitespace': ['error', { skipComments: true, skipStrings: true, skipTemplates: true, skipRegExps: true }],
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      // 儲存 / 音訊等「失敗也不影響遊戲」的地方允許空的 catch，但要寫 catch { /* 原因 */ }
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  {
    // Node 端腳本（驗證、建置工具）
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node } },
  },
];
