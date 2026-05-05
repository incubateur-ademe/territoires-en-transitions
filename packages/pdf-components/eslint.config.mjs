import baseConfig from '../../eslint.config.mjs';

const config = [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          depConstraints: [
            {
              sourceTag: 'scope:pdf-components',
              notDependOnLibsWithTags: ['scope:backend'],
            },
          ],
        },
      ],
    },
  },
];

export default config;
