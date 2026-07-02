import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'

export default [
  // 忽略目录
  { ignores: ['dist/**', 'node_modules/**', '*.cjs'] },

  // 基础 JS 规则
  js.configs.recommended,

  // Vue 规则（适用于 .vue 文件）
  ...pluginVue.configs['flat/recommended'],

  // Prettier 集成
  prettierConfig,

  // 全局自定义规则
  {
    files: ['src/**/*.{js,vue}'],
    plugins: { prettier: prettierPlugin },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URLSearchParams: 'readonly',
        import: 'readonly',
        import.meta: 'readonly',
      },
    },
    rules: {
      // Prettier 作为错误
      'prettier/prettier': 'error',

      // 代码质量
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',

      // Vue 特定
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'error',
      'vue/require-default-prop': 'off',
      'vue/require-prop-types': 'warn',
      'vue/html-self-closing': ['warn', {
        html: { void: 'always', normal: 'always', component: 'always' },
      }],
    },
  },
]
