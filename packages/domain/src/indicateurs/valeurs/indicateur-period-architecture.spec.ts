import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { indicateurPeriodiciteValues } from '../definitions/indicateur-periodicite.schema';

type ArchitectureRule = Readonly<{
  description: string;
  pattern: RegExp;
  allowedFiles: ReadonlySet<string>;
}>;

const repositoryRoot = fileURLToPath(
  new URL('../../../../../', import.meta.url)
);

const sourceRoots = ['apps', 'packages', 'supabase/functions'] as const;
const ignoredDirectoryNames = new Set([
  '.next',
  '.storybook',
  'coverage',
  'dist',
  'generated',
  'node_modules',
  'out-tsc',
  'storybook-static',
]);

const periodPolicyFiles = new Set([
  'packages/domain/src/indicateurs/valeurs/annual-indicateur-period.adapter.ts',
  'packages/domain/src/indicateurs/valeurs/indicateur-period.ts',
  'packages/domain/src/indicateurs/valeurs/calendar-month-period.strategy.ts',
  'packages/domain/src/indicateurs/valeurs/indicateur-period-presentation.ts',
  'apps/app/src/indicateurs/valeurs/indicateur-period-presentation.ts',
  'apps/backend/src/indicateurs/valeurs/indicateur-period.adapter.ts',
  'apps/backend/src/indicateurs/charts/indicateur-chart-period.adapter.ts',
  'supabase/functions/import_indicateur_emt/annual-indicateur-period.adapter.ts',
]);

const annualCompatibilityBoundary = new Set([
  // The expand-phase database default is removed by the final contract PR.
  'apps/backend/src/indicateurs/definitions/indicateur-definition.table.ts',
  // Date-only legacy writers remain annual; stored values always have a cadence.
  'apps/backend/src/indicateurs/valeurs/indicateur-period.adapter.ts',
  'apps/backend/src/indicateurs/valeurs/indicateur-valeur.table.ts',
  'apps/backend/src/indicateurs/definitions/mutate-definition/mutate-definition.input.ts',
  'apps/backend/src/indicateurs/import-indicateurs/import-indicateur-definition.dto.ts',
  'packages/domain/src/referentiels/scores/score-indicatif.schema.ts',
]);

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const periodiciteAlternation = indicateurPeriodiciteValues
  .map(escapeRegExp)
  .join('|');

const rules: ArchitectureRule[] = [
  {
    description:
      'dispatch de périodicité recopié hors du registre de stratégies',
    pattern: new RegExp(
      `(?:periodicite\\s*(?:===|!==|==|!=)\\s*['"](?:${periodiciteAlternation})['"]|['"](?:${periodiciteAlternation})['"]\\s*(?:===|!==|==|!=)\\s*[^\\n]*periodicite|case\\s+['"](?:${periodiciteAlternation})['"])`
    ),
    allowedFiles: periodPolicyFiles,
  },
  {
    description: 'fallback annuel implicite hors d’une frontière compatible',
    pattern:
      /(?:(?:\?\?|\|\|)\s*['"]annuelle['"]|(?:\.default\(\s*|\._default\(\s*[^,]+,\s*)['"]annuelle['"]\s*\))/,
    allowedFiles: annualCompatibilityBoundary,
  },
  {
    description: 'inférence de la périodicité depuis la forme d’une chaîne',
    pattern:
      /(?:period(?!icite|s\b)|periode(?!s\b)|dateValeur(?!s\b)|dateDebut(?!s\b))[^\n]{0,120}(?:\.includes\(\s*['"]-['"]\s*\)|\.split\(\s*['"]-['"]\s*\)|\.length\s*(?:===|!==|==|!=|<=|>=|<|>))/i,
    allowedFiles: periodPolicyFiles,
  },
  {
    description: 'période représentée par l’union ambiguë number | string',
    pattern:
      /(?:(?:period|periode)[^\n]{0,100}(?:number\s*\|\s*string|string\s*\|\s*number)|(?:number\s*\|\s*string|string\s*\|\s*number)[^\n]{0,100}(?:period|periode))/i,
    allowedFiles: periodPolicyFiles,
  },
  {
    description:
      'projection d’une date d’indicateur vers une année hors de l’adaptateur annuel',
    pattern:
      /(?:getYearFromIsoDate\([^)]*dateValeur[^)]*\)|new Date\([^)]*dateValeur[^)]*\)\.get(?:UTC)?FullYear\(\)|dateValeur\.(?:slice|substring)\(\s*0\s*,\s*4\s*\)|DateTime\.fromISO\([^)]*dateValeur[^)]*\)[^\n]{0,80}\.year)/i,
    allowedFiles: periodPolicyFiles,
  },
];

const listSourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirectoryNames.has(entry.name)) {
        return [];
      }
      return listSourceFiles(path);
    }
    if (!['.ts', '.tsx'].includes(extname(entry.name))) {
      return [];
    }
    if (/\.(?:spec|e2e-spec|test|stories|d)\.(?:ts|tsx)$/.test(entry.name)) {
      return [];
    }
    return [path];
  });

describe('architecture de la périodicité des indicateurs', () => {
  it('ne conserve aucune exception vers un fichier supprimé', () => {
    const allowedFiles = new Set(
      rules.flatMap(({ allowedFiles }) => [...allowedFiles])
    );

    expect(
      [...allowedFiles].filter(
        (file) => !existsSync(resolve(repositoryRoot, file))
      )
    ).toEqual([]);
  });

  it('rend la règle de dispatch exhaustive sur le registre courant', () => {
    const dispatchRule = rules[0];
    expect(dispatchRule).toBeDefined();
    for (const periodicite of indicateurPeriodiciteValues) {
      expect(
        dispatchRule?.pattern.test(`periodicite === '${periodicite}'`)
      ).toBe(true);
    }
  });

  it('détecte aussi la perte sémantique par projection vers une année', () => {
    const projectionRule = rules.find(({ description }) =>
      description.startsWith('projection')
    );
    expect(projectionRule).toBeDefined();
    expect(
      projectionRule?.pattern.test(
        'const annee = new Date(valeur.dateValeur).getFullYear();'
      )
    ).toBe(true);
    expect(
      projectionRule?.pattern.test('getYearFromIsoDate(valeur.dateValeur)')
    ).toBe(true);
  });

  it('détecte les deux syntaxes Zod de fallback annuel', () => {
    const fallbackRule = rules.find(({ description }) =>
      description.startsWith('fallback annuel')
    );
    expect(fallbackRule).toBeDefined();
    expect(fallbackRule?.pattern.test("schema.default('annuelle')")).toBe(true);
    expect(
      fallbackRule?.pattern.test("z._default(\n  schema,\n  'annuelle'\n)")
    ).toBe(true);
  });

  it('ignore la taille d’une collection de dates', () => {
    const inferenceRule = rules.find(({ description }) =>
      description.startsWith('inférence')
    );
    expect(inferenceRule).toBeDefined();
    expect(inferenceRule?.pattern.test('dateValeur.length === 4')).toBe(true);
    expect(inferenceRule?.pattern.test('dateValeurs.length === 0')).toBe(false);
  });

  it('centralise le dispatch, le parsing et les valeurs de compatibilité', () => {
    const violations = sourceRoots
      .flatMap((root) => listSourceFiles(resolve(repositoryRoot, root)))
      .flatMap((absolutePath) => {
        const file = relative(repositoryRoot, absolutePath);
        const source = readFileSync(absolutePath, 'utf8');
        return rules.flatMap((rule) => {
          if (rule.allowedFiles.has(file)) {
            return [];
          }
          const match = rule.pattern.exec(source);
          if (!match) {
            return [];
          }
          const line = source.slice(0, match.index).split('\n').length;
          return [`${file}:${line}: ${rule.description}`];
        });
      });

    expect(violations).toEqual([]);
  });
});
