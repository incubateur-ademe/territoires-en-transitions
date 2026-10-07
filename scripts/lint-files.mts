// Lint d'une liste de fichiers (hook de pre-commit, make lint files=…).
//
// PIÈGE : en flat config, ESLint résout sa configuration depuis le CWD et non
// depuis le fichier linté. Lancé de la racine il ignore les eslint.config.mjs
// par projet et laisse passer ce que `nx run-many -t lint` (la CI) refuse. On
// reproduit donc le découpage de nx : un groupe par projet, projet en CWD.
import { ESLint } from 'eslint';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const CONFIG_NAMES = ['eslint.config.mjs', 'eslint.config.mts'];

// baseline-browser-mapping (transitif de browserslist, tiré par les plugins
// ESLint) avertit sur console.warn dès son import quand ses données ont plus de
// deux mois : timestamp figé à la compilation, aucun opt-out. Le message ne dit
// rien du code linté, on l'écarte pour garder la sortie du hook lisible.
const warn = console.warn;
console.warn = (...args: Parameters<typeof console.warn>): void => {
  if (
    typeof args[0] === 'string' &&
    args[0].startsWith('[baseline-browser-mapping]')
  ) {
    return;
  }
  warn(...args);
};

const args = process.argv.slice(2).filter(Boolean);
const shouldFix = args.includes('--fix');
const files = args.filter((arg) => arg !== '--fix');
if (!files.length) process.exit(0);

const repoRoot = resolve(
  execFileSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  }).trim()
);

const projectDirOf = (file: string): string => {
  let dir = dirname(resolve(file));
  for (;;) {
    if (CONFIG_NAMES.some((name) => existsSync(resolve(dir, name)))) return dir;
    if (dir === repoRoot || dir === dirname(dir)) return repoRoot;
    dir = dirname(dir);
  }
};

const groups = new Map<string, string[]>();
for (const file of files) {
  const dir = projectDirOf(file);
  const group = groups.get(dir) ?? [];
  group.push(relative(dir, resolve(file)));
  groups.set(dir, group);
}

const formatter = await new ESLint({ cwd: repoRoot }).loadFormatter('stylish');
let failed = false;

for (const [dir, group] of groups) {
  const results = await new ESLint({ cwd: dir, fix: shouldFix }).lintFiles(
    group
  );
  if (shouldFix) {
    await ESLint.outputFixes(results);
  }
  const errors = ESLint.getErrorResults(results);
  if (!errors.length) continue;
  failed = true;
  process.stdout.write(await formatter.format(errors));
}

process.exit(failed ? 1 : 0);
