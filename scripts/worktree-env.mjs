// Prépare un git worktree pour le dev : slot de ports stable, fichiers
// .env.local générés (bloc géré, lignes étrangères préservées), .env.keys
// lié depuis le checkout principal. L'infra docker (supabase :54321/:54322,
// redis :6379, strapi :1337) reste PARTAGÉE avec le checkout principal —
// seuls les ports des apps sont décalés (slot × 100).
// No-op sur le checkout principal. Invoqué par make dev / make install /
// make worktree-env ; idempotent (slot persisté dans .env.local).
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { APPS } from './dev-apps.mjs';
import { readEnvValue, writeManagedBlock } from './env-local.mjs';

const BLOCK = 'tet-worktree';
const SLOTS = 9; // 9 tranches de 100 ports — largement assez de worktrees
const ENV_LOCAL = '.env.local';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

// Détection indépendante du cwd : dans un worktree lié, le git-dir propre
// (…/worktrees/<nom>) diffère du git-dir commun ; sur le checkout principal
// les deux coïncident. Les écritures se font ensuite depuis la racine.
const gitCommonDir = git(
  'rev-parse',
  '--path-format=absolute',
  '--git-common-dir'
);
const gitDir = git('rev-parse', '--path-format=absolute', '--absolute-git-dir');
if (resolve(gitDir) === resolve(gitCommonDir)) {
  console.error('✓ checkout principal — ports par défaut, rien à préparer');
  process.exit(0);
}
process.chdir(git('rev-parse', '--show-toplevel'));
const cwd = process.cwd();
const mainRoot = dirname(gitCommonDir);

// .env.keys (gitignoré) : lien vers celui du checkout principal — source
// unique, survit à une rotation des clés. Repli copie si le lien échoue.
if (!existsSync('.env.keys')) {
  const mainKeys = join(mainRoot, '.env.keys');
  if (existsSync(mainKeys)) {
    try {
      symlinkSync(mainKeys, '.env.keys');
    } catch {
      copyFileSync(mainKeys, '.env.keys');
    }
    console.error(`✓ .env.keys lié depuis ${mainRoot}`);
  } else {
    console.error(
      `⚠ pas de .env.keys dans ${mainRoot} — dotenvx ne pourra pas déchiffrer les .env`
    );
  }
}

// Slot de ports : hash stable du chemin, sondage linéaire contre les slots
// des worktrees frères, puis persisté → stable pour toute la vie du worktree.
// Pas de registre central : les .env.local des worktrees vivants font foi.
const siblingSlots = () => {
  const paths = git('worktree', 'list', '--porcelain')
    .split('\n')
    .filter((l) => l.startsWith('worktree '))
    .map((l) => l.slice('worktree '.length))
    .filter((p) => resolve(p) !== resolve(cwd));
  return new Set(
    paths
      .map((p) => Number(readEnvValue(join(p, ENV_LOCAL), 'TET_PORT_SLOT')))
      .filter((n) => Number.isInteger(n) && n > 0)
  );
};

let slot = Number(readEnvValue(ENV_LOCAL, 'TET_PORT_SLOT'));
const isNew = !(Number.isInteger(slot) && slot > 0);
if (isNew) {
  const hash = [...cwd].reduce((h, c) => (h * 33 + c.charCodeAt(0)) >>> 0, 5381);
  slot = (hash % SLOTS) + 1;
  const used = siblingSlots();
  let probes = 0;
  while (used.has(slot)) {
    if (++probes >= SLOTS) {
      console.error(
        `✗ les ${SLOTS} slots de ports sont pris — supprimez un worktree ou libérez un TET_PORT_SLOT`
      );
      process.exit(1);
    }
    slot = (slot % SLOTS) + 1;
  }
}

const offset = slot * 100;
const ports = Object.fromEntries(
  Object.entries(APPS).map(([app, { port }]) => [app, port + offset])
);
const url = (app) => `http://localhost:${ports[app]}`;

writeManagedBlock(ENV_LOCAL, BLOCK, [
  `TET_PORT_SLOT=${slot}`,
  ...Object.keys(APPS).map((app) => `${app.toUpperCase()}_PORT=${ports[app]}`),
]);

// URLs inter-apps recalculées, écrites dans les .env.local d'apps — chargés
// AVANT les .env committés par dotenvx (premier arrivé gagne). Supabase,
// redis et strapi ne sont PAS réécrits : infra partagée, ports standard.
const APP_URLS = {
  app: {
    NEXT_PUBLIC_AUTH_URL: url('auth'),
    NEXT_PUBLIC_BACKEND_URL: url('backend'),
    NEXT_PUBLIC_PANIER_URL: url('panier'),
    NEXT_PUBLIC_SITE_URL: url('site'),
  },
  auth: {
    NEXT_PUBLIC_APP_URL: url('app'),
    NEXT_PUBLIC_BACKEND_URL: url('backend'),
  },
  site: {
    NEXT_PUBLIC_APP_URL: url('app'),
    NEXT_PUBLIC_AUTH_URL: url('auth'),
  },
  panier: {
    NEXT_PUBLIC_APP_URL: url('app'),
    NEXT_PUBLIC_AUTH_URL: url('auth'),
  },
  backend: { APP_URL: url('app') },
};
for (const [app, vars] of Object.entries(APP_URLS)) {
  writeManagedBlock(
    join('apps', app, ENV_LOCAL),
    BLOCK,
    Object.entries(vars).map(([k, v]) => `${k}=${v}`)
  );
}

if (isNew) {
  console.error(`✓ worktree prêt — slot ${slot} (ports +${offset})`);
  for (const [app, port] of Object.entries(ports)) {
    console.error(`    ${app.padEnd(8)} http://localhost:${port}`);
  }
  console.error(
    `    supabase :54321/:54322, redis :6379, strapi :1337 — partagés avec ${mainRoot}`
  );
} else {
  console.error(`✓ worktree slot ${slot} (ports +${offset})`);
}
