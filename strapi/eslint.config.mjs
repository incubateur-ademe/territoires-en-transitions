import baseConfig from '../eslint.config.mjs';

export default [
  {
    ignores: [
      '**/dist',
      '**/build',
      '**/.cache',
      '**/.tmp',
      '**/node_modules',
      'database/**',
      'types/generated/**',
      'src/admin/**',
      'public/uploads/**',
    ],
  },
  ...baseConfig,
];

