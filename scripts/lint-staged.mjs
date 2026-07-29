#!/usr/bin/env node
// Lance ESLint sur les fichiers indexés (staged) avant commit.
//
// Les configs plates ne s'appliquent qu'aux fichiers situés sous leur propre
// répertoire : eslint résout `eslint.config.mjs` depuis son cwd, pas depuis le
// fichier analysé. On regroupe donc les fichiers par racine de projet et on
// lance un eslint par racine, comme le fait `nx run <projet>:lint`.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const LINTABLE = /\.(?:[cm]?[jt]s|[jt]sx)$/;
const CONFIG_FILES = [
  'eslint.config.mjs',
  'eslint.config.js',
  'eslint.config.cjs',
  'eslint.config.ts',
];

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8' }).trimEnd();

const repoRoot = git('rev-parse', '--show-toplevel');

// -z : les noms contenant des espaces ou de l'unicode échappé restent intacts.
// ACMR : on ignore les suppressions, le fichier n'existe plus sur le disque.
const stagedFiles = execFileSync(
  'git',
  ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'],
  { encoding: 'utf8', cwd: repoRoot }
)
  .split('\0')
  .filter(Boolean)
  .filter((file) => LINTABLE.test(file))
  .filter((file) => existsSync(join(repoRoot, file)));

if (stagedFiles.length === 0) {
  process.exit(0);
}

/** Remonte jusqu'à la racine du dépôt à la recherche d'une config ESLint. */
const findEslintRoot = (file) => {
  let dir = dirname(resolve(repoRoot, file));

  while (true) {
    if (CONFIG_FILES.some((config) => existsSync(join(dir, config)))) {
      return dir;
    }
    if (dir === repoRoot) {
      return null;
    }
    dir = dirname(dir);
  }
};

/** @type {Map<string, string[]>} */
const filesByRoot = new Map();

for (const file of stagedFiles) {
  const root = findEslintRoot(file);
  if (!root) {
    continue;
  }
  const files = filesByRoot.get(root) ?? [];
  files.push(relative(root, resolve(repoRoot, file)));
  filesByRoot.set(root, files);
}

if (filesByRoot.size === 0) {
  process.exit(0);
}

const eslintBin = join(repoRoot, 'node_modules', '.bin', 'eslint');
if (!existsSync(eslintBin)) {
  console.error('✗ eslint introuvable — lancer `make install` (ou `pnpm i`).');
  process.exit(1);
}

const failedRoots = [];

for (const [root, files] of filesByRoot) {
  const label = relative(repoRoot, root) || '.';
  console.log(`› lint ${label} (${files.length} fichier(s))`);

  try {
    // --no-warn-ignored : un fichier couvert par un ignore n'est pas une erreur.
    execFileSync(eslintBin, ['--quiet', '--no-warn-ignored', '--', ...files], {
      cwd: root,
      stdio: 'inherit',
    });
  } catch {
    failedRoots.push(label);
  }
}

if (failedRoots.length > 0) {
  console.error(
    `\n✗ Lint en échec : ${failedRoots.join(', ')}.\n` +
      '  Corrigez les erreurs (`eslint --fix` en corrige une partie) ou ' +
      'contournez avec `git commit --no-verify`.'
  );
  process.exit(1);
}
