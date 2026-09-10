import { readdirSync, readFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import ts from 'typescript';

const appRoot = resolve(import.meta.dirname, '../..');

const frontendScopeRoots = [
  'src/indicateurs',
  'src/app/pages/collectivite/Indicateurs',
  'src/demarches/pcaet/diagnostic/indicateurs-grid',
  'app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/score-indicatif',
] as const;

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
      /\.(?:spec|test|stories|fixture|sample)\.(?:ts|tsx)$/.test(entry.name)
    ) {
      return [];
    }
    return [path];
  });

const parseSourceFile = (path: string): ts.SourceFile =>
  ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

const listModuleSpecifiers = (sourceFile: ts.SourceFile): string[] => {
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

const databaseMethodNames = new Set([
  'delete',
  'from',
  'insert',
  'rpc',
  'select',
  'update',
]);

const getRootIdentifier = (expression: ts.Expression): string | null => {
  let current = expression;
  while (ts.isPropertyAccessExpression(current)) {
    current = current.expression;
  }
  return ts.isIdentifier(current) ? current.text : null;
};

const listForbiddenCalls = (sourceFile: ts.SourceFile): string[] => {
  const violations: string[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      if (
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'fetch'
      ) {
        violations.push('fetch(...)');
      } else if (
        ts.isPropertyAccessExpression(node.expression) &&
        databaseMethodNames.has(node.expression.name.text)
      ) {
        const rootIdentifier = getRootIdentifier(node.expression);
        if (
          rootIdentifier &&
          ['database', 'databaseService', 'supabase'].includes(rootIdentifier)
        ) {
          violations.push(
            `${rootIdentifier}.${node.expression.name.text}(...)`
          );
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return violations;
};

const formatViolation = (path: string, detail: string): string =>
  `${relative(appRoot, path)}: ${detail}`;

describe('architecture du flux de données frontend des indicateurs', () => {
  it('passe exclusivement par le client tRPC pour les données applicatives', () => {
    const violations = frontendScopeRoots
      .flatMap((root) => listSourceFiles(resolve(appRoot, root)))
      .flatMap((path) => {
        const sourceFile = parseSourceFile(path);
        const forbiddenImports = listModuleSpecifiers(sourceFile).filter(
          (specifier) =>
            specifier.startsWith('@tet/backend/') ||
            specifier.startsWith('@supabase/') ||
            specifier.includes('initSupabase')
        );

        return [
          ...forbiddenImports.map((specifier) =>
            formatViolation(path, `import ${specifier}`)
          ),
          ...listForbiddenCalls(sourceFile).map((call) =>
            formatViolation(path, `appel direct ${call}`)
          ),
        ];
      });

    expect(violations).toEqual([]);
  });
});
