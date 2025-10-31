import baseConfig from '../../eslint.config.mjs';

const config = [
  {
    ignores: ['**/dist'],
  },
  ...baseConfig,
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@/backend/**/index-domain', '@/domain/**'],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {},
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {},
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {},
  },
];

export default config;