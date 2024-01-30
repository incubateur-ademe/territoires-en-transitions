module.exports = {
  extends: ['next/core-web-vitals'],
  plugins: ['jsx-expressions'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  rules: {
    'jsx-expressions/strict-logical-expressions': 'warn',
  },
};
