import baseConfig from '../../eslint.config.mjs';

export default [
  {
    ignores: ['**/dist', 'webpack.config.js'],
  },
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allowCircularSelfDependency: true,
          banTransitiveDependencies: true,
          allow: ['@/backend'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
];
