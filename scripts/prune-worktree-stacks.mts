// Nettoie les stacks docker « fantômes » des worktrees : supprimer un
// worktree sans make down laisse son projet compose tet-wt<slot> tourner —
// et un futur worktree peut hériter du slot et adopter ces conteneurs.
// Fantôme = projet tet-wt* dont le slot n'est réclamé par aucun worktree
// vivant (TET_PORT_SLOT de son .env.local). Le down emporte les volumes du
// projet (node-modules, nx-workspace-data) ; les volumes partagés
// (tet_pnpm-store, tet_nx-cache) sont déclarés external — jamais touchés.
// Appelable d'où on veut : make worktree-prune.
import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { readEnvValue } from './env-local.mts';

const green = (s: string): void => console.error(`\x1b[32m${s}\x1b[0m`);

const run = (cmd: string, args: string[]): string =>
  execFileSync(cmd, args, { encoding: 'utf8' }).trim();

// Les entrées de worktrees supprimés à la main ne doivent pas compter comme
// vivantes : prune administratif d'abord (officiel, sans risque).
run('git', ['worktree', 'prune']);

const living = new Set(
  run('git', ['worktree', 'list', '--porcelain'])
    .split('\n')
    .filter((l) => l.startsWith('worktree '))
    .map((l) =>
      readEnvValue(
        join(l.slice('worktree '.length), '.env.local'),
        'TET_PORT_SLOT'
      )
    )
    .filter(Boolean)
    .map((slot) => `tet-wt${slot}`)
);

const docker = (process.env.DOCKER || 'docker').split(' ');
const projects = JSON.parse(
  run(docker[0], [...docker.slice(1), 'compose', 'ls', '-a', '--format', 'json'])
)
  .map((p: { Name: string }) => p.Name)
  .filter((name: string) => /^tet-wt\d+$/.test(name) && !living.has(name));

if (!projects.length) {
  green('✓ aucune stack fantôme');
  process.exit(0);
}

for (const project of projects) {
  console.error(`⏹ stack fantôme ${project} (aucun worktree ne réclame ce slot) — down…`);
  const res = spawnSync(
    docker[0],
    [
      ...docker.slice(1),
      'compose',
      '-p',
      project,
      'down',
      '--volumes',
      '--remove-orphans',
    ],
    { stdio: 'inherit' }
  );
  if (res.status !== 0) process.exit(res.status ?? 1);
}
green(`✓ ${projects.length} stack(s) fantôme(s) nettoyée(s)`);
