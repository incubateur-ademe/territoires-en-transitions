import { readdirSync, readFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import ts from 'typescript';

const repositoryRoot = resolve(__dirname, '../../../..');

const backendScopeRoots = [
  'apps/backend/src/indicateurs',
  'apps/backend/src/referentiels/score-indicatif',
] as const;

const additionalBackendScopeFiles = [
  'apps/backend/src/demarches/pcaet/shared/demarche-pcaet-diagnostic.service.ts',
  'apps/backend/src/referentiels/import-referentiel/import-referentiel.service.ts',
  'apps/backend/src/users/authorizations/permission.repository.ts',
  'apps/backend/src/users/authorizations/permission.service.ts',
] as const;

/**
 * Dette antérieure à l'électrification mensuelle. Cette liste est
 * volontairement exacte : dès qu'un service est migré, le test oblige à le
 * retirer plutôt que de laisser une exception morte devenir permanente.
 */
const legacyServicePersistenceAllowlist = new Set([
  'apps/backend/src/indicateurs/indicateurs/list-indicateurs/list-indicateurs.service.ts',
  'apps/backend/src/indicateurs/valeurs/valeurs-moyenne.service.ts',
  'apps/backend/src/indicateurs/valeurs/valeurs-reference.service.ts',
]);

const ignoredDirectoryNames = new Set([
  '.next',
  'coverage',
  'dist',
  'generated',
  'node_modules',
  'out-tsc',
]);

const listSourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      return ignoredDirectoryNames.has(entry.name) ? [] : listSourceFiles(path);
    }
    if (!['.ts', '.tsx'].includes(extname(entry.name))) return [];
    if (
      /\.(?:e2e-spec|spec|test|stories|fixture|sample)\.(?:ts|tsx)$/.test(
        entry.name
      )
    ) {
      return [];
    }
    return [path];
  });

const listScopedFiles = (roots: readonly string[]): string[] =>
  roots.flatMap((root) => listSourceFiles(resolve(repositoryRoot, root)));

const parseSourceFile = (path: string): ts.SourceFile =>
  ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

const importSpecifiers = (path: string): string[] => {
  const sourceFile = parseSourceFile(path);
  const specifiers: string[] = [];

  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      specifiers.push(node.moduleReference.expression.text);
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require'))
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return specifiers;
};

const standaloneRuntimeExports = (path: string): string[] =>
  parseSourceFile(path).statements.flatMap((statement) => {
    if (
      !(
        ts.isFunctionDeclaration(statement) || ts.isVariableStatement(statement)
      ) ||
      !statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
      )
    ) {
      return [];
    }

    if (ts.isFunctionDeclaration(statement)) {
      return [statement.name?.text ?? 'default function'];
    }

    return statement.declarationList.declarations.map((declaration) =>
      declaration.name.getText()
    );
  });

const trustedContextBypasses = (path: string): string[] => {
  const sourceFile = parseSourceFile(path);
  const bypasses: string[] = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isPropertyAssignment(node) &&
      node.initializer.kind === ts.SyntaxKind.TrueKeyword &&
      ((ts.isIdentifier(node.name) && node.name.text === 'isUserTrusted') ||
        (ts.isStringLiteral(node.name) && node.name.text === 'isUserTrusted'))
    ) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart()
      );
      bypasses.push(`isUserTrusted: true (ligne ${line + 1})`);
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return bypasses;
};

const isPersistenceImport = (specifier: string): boolean =>
  specifier === 'drizzle-orm' ||
  specifier.startsWith('drizzle-orm/') ||
  ['pg', 'postgres', 'postgres-js'].includes(specifier) ||
  specifier.startsWith('@supabase/') ||
  /(?:^|\/)database\.service(?:\.ts)?$/.test(specifier) ||
  /\.table(?:\.ts)?$/.test(specifier);

const formatViolation = (absolutePath: string, detail: string): string =>
  `${relative(repositoryRoot, absolutePath)}: ${detail}`;

describe('architecture du flux de données des indicateurs', () => {
  const backendFiles = [
    ...listScopedFiles(backendScopeRoots),
    ...additionalBackendScopeFiles.map((path) => resolve(repositoryRoot, path)),
  ];

  it('réserve Drizzle et les tables aux repositories', () => {
    const servicesWithPersistence = backendFiles
      .filter((path) => path.endsWith('.service.ts'))
      .filter((path) => importSpecifiers(path).some(isPersistenceImport))
      .map((path) => relative(repositoryRoot, path))
      .sort();

    expect(servicesWithPersistence).toEqual(
      [...legacyServicePersistenceAllowlist].sort()
    );
  });

  it('interdit aux routers et controllers de contourner le service applicatif', () => {
    const violations = backendFiles
      .filter(
        (path) => path.endsWith('.router.ts') || path.endsWith('.controller.ts')
      )
      .flatMap((path) =>
        importSpecifiers(path)
          .filter(
            (specifier) =>
              isPersistenceImport(specifier) ||
              /\.repository(?:\.ts)?$/.test(specifier)
          )
          .map((specifier) => formatViolation(path, specifier))
      );

    expect(violations).toEqual([]);
  });

  it("réserve le contournement explicite d'autorisation aux services internes", () => {
    const violations = backendFiles
      .filter(
        (path) => path.endsWith('.router.ts') || path.endsWith('.controller.ts')
      )
      .flatMap((path) =>
        trustedContextBypasses(path).map((bypass) =>
          formatViolation(path, bypass)
        )
      );

    expect(violations).toEqual([]);
  });

  it('maintient les repositories indépendants des couches applicative et transport', () => {
    const violations = backendFiles
      .filter((path) => path.endsWith('.repository.ts'))
      .flatMap((path) =>
        importSpecifiers(path)
          .filter(
            (specifier) =>
              /\.(?:router|controller|request|input)(?:\.ts)?$/.test(
                specifier
              ) ||
              (/\.service(?:\.ts)?$/.test(specifier) &&
                !/(?:^|\/)database\.service(?:\.ts)?$/.test(specifier))
          )
          .map((specifier) => formatViolation(path, specifier))
      );

    expect(violations).toEqual([]);
  });

  it('encapsule les détails de persistance derrière les classes repository', () => {
    const violations = backendFiles
      .filter((path) => path.endsWith('.repository.ts'))
      .flatMap((path) =>
        standaloneRuntimeExports(path).map((exportName) =>
          formatViolation(path, `export runtime autonome « ${exportName} »`)
        )
      );

    expect(violations).toEqual([]);
  });

  it.each([
    'drizzle-orm',
    'drizzle-orm/sql',
    '@supabase/supabase-js',
    '@tet/backend/utils/database/database.service',
    '../models/indicateur.table',
    '../models/indicateur.table.ts',
  ])('reconnaît %s comme une dépendance de persistance', (specifier) => {
    expect(isPersistenceImport(specifier)).toBe(true);
  });

  it("reconnaît une capacité interne de contournement d'autorisation", () => {
    const crudValeursServicePath = resolve(
      repositoryRoot,
      'apps/backend/src/indicateurs/valeurs/crud-valeurs.service.ts'
    );

    expect(
      trustedContextBypasses(crudValeursServicePath).length
    ).toBeGreaterThan(0);
  });
});
