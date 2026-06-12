/** @type {import('@nx/eslint-plugin').DepConstraint} */
export const frontendLuxonBanConstraint = {
  sourceTag: 'frontend',
  bannedExternalImports: ['luxon'],
};

/**
 * ESLint config block that bans luxon in Next.js apps tagged `frontend`.
 *
 * @param {Omit<import('@nx/eslint-plugin').ModuleBoundaryConfig, 'depConstraints'> & { depConstraints?: import('@nx/eslint-plugin').DepConstraint[] }} [options]
 */
export const frontendEnforceModuleBoundaries = (options = {}) => ({
  files: ['**/*.ts', '**/*.tsx'],
  rules: {
    '@nx/enforce-module-boundaries': [
      'error',
      {
        ...options,
        depConstraints: [
          frontendLuxonBanConstraint,
          ...(options.depConstraints ?? []),
        ],
      },
    ],
  },
});

/** ESLint config block that bans luxon in shared frontend libraries. */
export const frontendLuxonImportBan = () => ({
  files: ['**/*.ts', '**/*.tsx'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'luxon',
            message:
              'Use date-fns or native Date APIs instead. Luxon must not be included in frontend bundles.',
          },
        ],
        patterns: [
          {
            group: ['luxon/*'],
            message:
              'Use date-fns or native Date APIs instead. Luxon must not be included in frontend bundles.',
          },
        ],
      },
    ],
  },
});
