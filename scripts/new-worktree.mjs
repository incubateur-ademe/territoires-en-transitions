// Crée un git worktree prêt à l'emploi : branche conventionnelle
// (https://conventionalbranch.org — <type>/<description> en kebab-case),
// dossier frère du checkout principal (tet-<description>), préparation
// complète via scripts/worktree-env.mjs (slot de ports, .env.local, .env.keys)
// puis, au choix, lancement immédiat : côté hôte (make dev — les dépendances
// s'installent silencieusement juste avant) ou côté docker (make up — le
// service deps installe dans le conteneur, rien à faire sur l'hôte).
//   make worktree                                → interactif
//   make worktree t=feature n=great-feature → sans prompt (agents)
// UI sur stderr ; la branche part du HEAD du checkout principal (il porte
// l'outillage worktree — une branche plus ancienne ne l'aurait pas).
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const TYPES = [
  { value: 'feature', title: 'feature — nouvelle fonctionnalité' },
  { value: 'bugfix', title: 'bugfix — correction de bug' },
  { value: 'hotfix', title: 'hotfix — correctif urgent' },
  { value: 'release', title: 'release — préparation de release' },
  { value: 'chore', title: 'chore — outillage, maintenance, docs' },
];

const red = (s) => console.error(`\x1b[31m${s}\x1b[0m`);
const green = (s) => console.error(`\x1b[32m${s}\x1b[0m`);
const blue = (s) => console.error(`\x1b[34m${s}\x1b[0m`);

// stdio: inherit → execFileSync retourne null : on normalise en chaîne vide.
const git = (args, opts = {}) =>
  (execFileSync('git', args, { encoding: 'utf8', ...opts }) ?? '').trim();

const mainRoot = dirname(
  git(['rev-parse', '--path-format=absolute', '--git-common-dir'])
);

// Description → kebab-case strict (minuscules, a-z0-9, tirets simples).
const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

let [type, rawName] = process.argv.slice(2).filter(Boolean);

if ((!type || !rawName) && !process.stderr.isTTY) {
  red(
    `✗ pas de TTY : précisez make worktree t=<${TYPES.map((t) => t.value).join('|')}|…> n=<nom-du-sujet>`
  );
  process.exit(1);
}

const { default: prompts } = await import('prompts');
const onCancel = () => process.exit(1);

// Les types conventionnels sont des suggestions, pas une liste fermée :
// « autre » (ou t=<type-libre>) accepte n'importe quel préfixe kebab-case.
const CUSTOM = Symbol('autre');
if (!type) {
  ({ type } = await prompts(
    {
      type: 'select',
      name: 'type',
      message: 'Type de worktree (conventional branch)',
      choices: [
        ...TYPES,
        { value: CUSTOM, title: 'autre — saisir un type personnalisé' },
      ],
      stdout: process.stderr,
    },
    { onCancel }
  ));
  if (type === CUSTOM) {
    ({ type } = await prompts(
      {
        type: 'text',
        name: 'type',
        message: 'Type personnalisé (ex. perf, spike, docs)',
        validate: (v) => (slugify(v) ? true : 'type vide après normalisation'),
        stdout: process.stderr,
      },
      { onCancel }
    ));
  }
}
type = slugify(type ?? '');
if (!type) {
  red('✗ type vide après normalisation kebab-case');
  process.exit(1);
}

if (!rawName) {
  ({ rawName } = await prompts(
    {
      type: 'text',
      name: 'rawName',
      message: 'Nom du sujet (ex. great-feature)',
      validate: (v) => (slugify(v) ? true : 'nom vide après normalisation'),
      stdout: process.stderr,
    },
    { onCancel }
  ));
}
const slug = slugify(rawName ?? '');
if (!slug) {
  red('✗ nom vide après normalisation kebab-case');
  process.exit(1);
}

const branch = `${type}/${slug}`;
const path = join(dirname(mainRoot), `tet-${slug}`);

if (git(['branch', '--list', branch], { cwd: mainRoot })) {
  red(`✗ la branche ${branch} existe déjà`);
  process.exit(1);
}
if (existsSync(path)) {
  red(`✗ le dossier ${path} existe déjà`);
  process.exit(1);
}

const base = git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: mainRoot });
blue(`→ git worktree add ${path} -b ${branch}  (base : ${base})`);
git(['worktree', 'add', path, '-b', branch], { cwd: mainRoot, stdio: ['ignore', 'inherit', 'inherit'] });

// Slot de ports + .env.local + copie de .env.keys — le script du worktree
// lui-même (sa branche part du HEAD du principal, il l'embarque).
const env = spawnSync('node', ['scripts/worktree-env.mjs'], {
  cwd: path,
  stdio: 'inherit',
});
if (env.status !== 0) process.exit(env.status ?? 1);

const recap = () => {
  green(`✓ worktree prêt : ${path}  (branche ${branch})`);
  blue(`    cd ${path}`);
  blue('    make dev apps=app,auth,backend   # mode hôte (ports du slot ci-dessus)');
  blue('    make up                          # mode docker (stack dédiée, infra partagée)');
  blue(`    git worktree remove ${basename(path)}   # depuis ${dirname(mainRoot)}, une fois le sujet terminé`);
};

// Lancement immédiat au choix — les dépendances manquantes s'installent
// automatiquement (cible ensure-deps du Makefile, silencieuse).
if (process.stderr.isTTY && !process.argv[3]) {
  const { launch } = await prompts(
    {
      type: 'select',
      name: 'launch',
      message: 'Lancer le dev maintenant ?',
      choices: [
        { value: 'dev', title: 'côté hôte — make dev' },
        { value: 'up', title: 'côté docker — make up' },
        { value: null, title: 'plus tard' },
      ],
      stdout: process.stderr,
    },
    { onCancel }
  );
  if (launch) {
    recap(); // avant de céder le terminal au process long
    const res = spawnSync('make', [launch], { cwd: path, stdio: 'inherit' });
    process.exit(res.status ?? 0);
  }
}

recap();
