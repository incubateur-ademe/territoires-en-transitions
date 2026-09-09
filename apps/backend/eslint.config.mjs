import baseConfig from '../../eslint.config.mjs';

const config = [
  ...baseConfig,
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@tet/backend/**/index-domain'],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allowCircularSelfDependency: true,
          banTransitiveDependencies: false,
          allow: ['@tet/backend/*'],
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
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {},
  },
  {
    files: [
      'src/indicateurs/**/*.service.ts',
      'src/referentiels/score-indicatif/**/*.service.ts',
      'src/demarches/pcaet/shared/demarche-pcaet-diagnostic.service.ts',
      'src/referentiels/import-referentiel/import-referentiel.service.ts',
      'src/users/authorizations/permission.service.ts',
    ],
    ignores: [
      'src/indicateurs/indicateurs/list-indicateurs/list-indicateurs.service.ts',
      'src/indicateurs/valeurs/valeurs-moyenne.service.ts',
      'src/indicateurs/valeurs/valeurs-reference.service.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@tet/backend/**/index-domain',
                'drizzle-orm',
                'drizzle-orm/**',
                '@supabase/**',
                '**/*.table',
                '**/*.table.ts',
                '**/database.service',
                '**/database.service.ts',
              ],
              message:
                'Application services must delegate persistence to a repository.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/indicateurs/**/*.router.ts',
      'src/indicateurs/**/*.controller.ts',
      'src/referentiels/score-indicatif/**/*.router.ts',
      'src/referentiels/score-indicatif/**/*.controller.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Property[key.name='isUserTrusted'][value.value=true]",
          message:
            'Transport adapters must pass their authenticated user; only internal application services may bypass authorization explicitly.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@tet/backend/**/index-domain',
                'drizzle-orm',
                'drizzle-orm/**',
                '@supabase/**',
                '**/*.table',
                '**/*.table.ts',
                '**/*.repository',
                '**/*.repository.ts',
                '**/database.service',
                '**/database.service.ts',
              ],
              message:
                'Transport adapters must delegate to an application service.',
            },
          ],
        },
      ],
    },
  },
];

export default config;
