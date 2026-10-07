// Démarrage de la stack conteneurisée — le corps de `make up`.
// Enchaîne, dans l'ordre : sélection des composants (pick-stack.mts), socle des
// apps, infra, arrêt des composants décochés, `compose up`.
//
// Deux contextes, d'où les branchements :
//  - tronc principal : la stack `tet` complète, infra et apps ensemble ;
//  - worktree lié : ses apps seules (projet tet-wt<slot>) — l'infra qu'elles
//    exigent est démarrée dans la stack du tronc, via un make -C là-bas.
//
// Options relayées par le Makefile : --profile <nom> (profile enregistré),
// --ask (rouvrir le sélecteur), --build (reconstruire les images à build
// local : strapi, sqitch).
import { spawnSync } from 'node:child_process';
import {
  compose,
  composeLines,
  isWorktree,
  mainRoot,
  repoRoot,
} from './compose.mts';
import { APPS, infraFor } from './dev-apps.mts';
import * as nodeBase from './node-base.mts';

process.chdir(repoRoot);

const args = process.argv.slice(2);
const wantsBuild = args.includes('--build');
// --profile <nom> et --ask sont l'affaire du sélecteur : relayés tels quels.
const pickerArgs = args.filter((a) => a !== '--build');

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

// Cibles du Makefile réutilisées telles quelles (préflight inotify, infra du
// tronc) : leur logique n'a pas à être dupliquée ici.
const make = (targets: string[], env: NodeJS.ProcessEnv = {}): void => {
  const { status } = spawnSync(
    process.env.MAKE ?? 'make',
    ['--no-print-directory', ...targets],
    { stdio: 'inherit', env: { ...process.env, ...env } }
  );
  if (status !== 0) process.exit(status ?? 1);
};

const node = (script: string, scriptArgs: string[] = []): string => {
  const { status, stdout } = spawnSync(
    process.execPath,
    [script, ...scriptArgs],
    { encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] }
  );
  if (status !== 0) process.exit(status ?? 1);
  return stdout.trim();
};

// ——— 1. Sélection des composants ———————————————————————————————————————————
if (isWorktree) node('scripts/worktree-env.mts');

const profiles = node('scripts/pick-stack.mts', pickerArgs).split(',');
const apps = profiles.filter((p) => APPS[p]);
if (isWorktree && !apps.length)
  fail(
    '✗ aucune app cochée — un worktree ne lance que des apps (make up ask=1)'
  );

// Profils démarrés ICI : dans un worktree, les apps seules (leur infra tourne
// dans la stack du tronc) ; sur le tronc, toute la sélection.
const local = isWorktree ? apps : profiles;

// ——— 2. Socle des apps ————————————————————————————————————————————————————
// Une image absente bloque (rien avec quoi démarrer) ; obsolète, on démarre
// dessus et on reconstruit après coup (cf. étape 6).
let baseState: nodeBase.BaseState = 'ok';
if (apps.length) {
  make(['preflight-inotify']);
  baseState = nodeBase.state();
  if (baseState === 'missing') {
    console.error(
      '🛠 socle des apps absent — construction (plusieurs minutes la 1re fois)'
    );
    nodeBase.build();
  }
}

// ——— 3. Infra ——————————————————————————————————————————————————————————————
if (isWorktree)
  make(['-C', mainRoot, 'services-scoped-up'], {
    COMPOSE_PROFILES: infraFor(apps).join(','),
  });
else make(['heal-db']);

// ——— 4. Arrêt des composants décochés —————————————————————————————————————
const enabled = composeLines(['config', '--services'], { profiles: local });
const running = composeLines([
  '--profile',
  '*',
  'ps',
  '--format',
  '{{.Service}}',
]);
const unselected = running.filter((svc) => !enabled.includes(svc));
if (unselected.length) {
  console.error(`⏹ arrêt des composants décochés : ${unselected.join(', ')}`);
  compose(['--profile', '*', 'stop', ...unselected]);
}

// ——— 5. Démarrage —————————————————————————————————————————————————————————
const up = compose(
  [
    'up',
    '-d',
    ...(wantsBuild ? ['--build'] : []),
    '--wait',
    '--remove-orphans',
  ],
  { profiles: local }
);
if (up !== 0)
  fail(
    isWorktree
      ? "✗ une app n'est pas devenue saine — make logs s=<app> pour investiguer"
      : "✗ une app n'est pas devenue saine — les services restent en marche ; make logs s=<app> pour investiguer"
  );

// ——— 6. Socle obsolète : rattrapage en tâche de fond ——————————————————————
if (baseState === 'stale') nodeBase.rebuildInBackground();
