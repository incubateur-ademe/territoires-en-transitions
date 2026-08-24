// Contexte docker compose du checkout courant : binaire docker, enveloppe
// dotenvx (les .env du dépôt sont chiffrés — jamais de `docker compose` nu) et
// projet/fichiers selon le checkout. Miroir en TypeScript des macros COMPOSE /
// compose_here du Makefile, partagé par up.mts et node-base.mts.
//
// Tronc principal : la stack partagée `tet` (name: fixe du docker-compose.yml).
// Worktree lié : ses apps seules, dans le projet tet-wt<slot>
// (docker-compose.worktree.yml) — l'infra vit dans la stack du tronc.
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { readEnvValue, readEnvVars } from './env-local.mts';

const ENV_LOCAL = '.env.local';

export const DOCKER = process.env.DOCKER ?? 'docker';

// Surchargeable par le Makefile (DOTENVX) : binaire local quand pnpm l'a
// installé, `npx -y @dotenvx/dotenvx` sinon — d'où le split sur l'espace.
const DOTENVX = (process.env.DOTENVX ?? 'npx -y @dotenvx/dotenvx').split(' ');

const git = (...args: string[]): string =>
  execFileSync('git', args, { encoding: 'utf8' }).trim();

// Détection indépendante du cwd (même critère que worktree-env.mts) : dans un
// worktree lié, le git-dir propre diffère du git-dir commun.
const gitCommonDir = git(
  'rev-parse',
  '--path-format=absolute',
  '--git-common-dir'
);
export const isWorktree =
  resolve(git('rev-parse', '--path-format=absolute', '--absolute-git-dir')) !==
  resolve(gitCommonDir);
/** Racine du checkout principal, propriétaire de la stack `tet`. */
export const mainRoot = dirname(gitCommonDir);
/** Racine du checkout courant (tronc ou worktree). */
export const repoRoot = git('rev-parse', '--show-toplevel');

const portSlot = (): string => readEnvValue(ENV_LOCAL, 'TET_PORT_SLOT') ?? '';

// Les ports décalés d'un worktree (*_PORT) vivent dans son .env.local, que
// compose ne charge pas de lui-même (seul le .env du projet l'est) : sans eux
// l'interpolation du docker-compose retomberait sur les ports standard, déjà
// pris par le tronc.
const contextEnv = (): NodeJS.ProcessEnv =>
  isWorktree
    ? {
        ...process.env,
        ...readEnvVars(ENV_LOCAL),
        COMPOSE_PROJECT_NAME: `tet-wt${portSlot()}`,
      }
    : { ...process.env };

const composeArgv = (args: string[]): string[] => [
  ...DOTENVX.slice(1),
  'run',
  '-q',
  '--env-keys-file=.env.keys',
  '-f',
  '.env',
  '--',
  DOCKER,
  'compose',
  ...(isWorktree
    ? ['-f', 'docker-compose.yml', '-f', 'docker-compose.worktree.yml']
    : []),
  ...args,
];

interface ComposeOptions {
  /** Valeur de COMPOSE_PROFILES pour cette commande (sinon : celle du contexte). */
  profiles?: string[];
}

/** Lance une commande compose en laissant sa sortie à l'écran ; rend son code. */
export const compose = (args: string[], opts: ComposeOptions = {}): number => {
  const { status } = spawnSync(DOTENVX[0], composeArgv(args), {
    cwd: repoRoot,
    stdio: 'inherit',
    env: withProfiles(opts),
  });
  return status ?? 1;
};

/** Idem, mais capture stdout (chaîne vide si la commande échoue). */
export const composeOut = (
  args: string[],
  opts: ComposeOptions = {}
): string => {
  const { status, stdout } = spawnSync(DOTENVX[0], composeArgv(args), {
    cwd: repoRoot,
    encoding: 'utf8',
    env: withProfiles(opts),
  });
  return status === 0 ? stdout.trim() : '';
};

/** Lignes non vides de la sortie d'une commande compose. */
export const composeLines = (
  args: string[],
  opts: ComposeOptions = {}
): string[] => composeOut(args, opts).split('\n').filter(Boolean);

const withProfiles = ({ profiles }: ComposeOptions): NodeJS.ProcessEnv =>
  profiles
    ? { ...contextEnv(), COMPOSE_PROFILES: profiles.join(',') }
    : contextEnv();
