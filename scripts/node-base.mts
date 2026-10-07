// Socle commun des conteneurs d'apps : l'image tet-node-dev construite depuis
// .docker/apps/base.Dockerfile, dont tous les services d'apps du
// docker-compose dérivent tels quels.
//
// Le build ne dépend QUE du Dockerfile et de l'UID/GID hôte : leur empreinte,
// posée en label, dit si l'image présente est encore celle qu'on construirait
// aujourd'hui — sans repasser par `docker build`, qui coûte ~2 s de résolution
// registre même quand tout est en cache. Une image obsolète ne bloque pas le
// démarrage : la stack part sur l'existante, la reconstruction se fait en
// tâche de fond et les conteneurs sont recréés dessus à la fin.
//
// Importable (up.mts) et exécutable :
//   node scripts/node-base.mts <build|swap|rebuild|state>
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { openSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compose, composeLines, DOCKER, repoRoot } from './compose.mts';

export const IMAGE = 'tet-node-dev';

const DOCKERFILE = '.docker/apps/base.Dockerfile';
const CONTEXT = '.docker/apps';
const LABEL = 'tet.fingerprint';
/** Journal de la reconstruction détachée (gitignoré). */
export const LOG = '.docker/node-base-build.log';

const id = (key: 'UID' | 'GID'): string =>
  process.env[key] ??
  String((key === 'UID' ? process.getuid?.() : process.getgid?.()) ?? 1000);

const fingerprint = (): string => {
  const sha = createHash('sha1')
    .update(readFileSync(`${repoRoot}/${DOCKERFILE}`))
    .digest('hex')
    .slice(0, 12);
  return `${sha}-${id('UID')}-${id('GID')}`;
};

const imageLabel = (): string | null => {
  const { status, stdout } = spawnSync(
    DOCKER,
    [
      'image',
      'inspect',
      IMAGE,
      '--format',
      `{{index .Config.Labels "${LABEL}"}}`,
    ],
    { encoding: 'utf8' }
  );
  return status === 0 ? stdout.trim() : null;
};

/**
 * missing : rien avec quoi démarrer (build bloquant) ;
 * stale : démarrable, mais à reconstruire (en tâche de fond) ;
 * ok : rien à faire.
 */
export type BaseState = 'missing' | 'stale' | 'ok';

export const state = (): BaseState => {
  const label = imageLabel();
  if (label === null) return 'missing';
  return label === fingerprint() ? 'ok' : 'stale';
};

export const build = (): void => {
  const { status } = spawnSync(
    DOCKER,
    // prettier-ignore
    ['build', '-t', IMAGE, '-f', DOCKERFILE, '--build-arg', `UID=${id('UID')}`, '--build-arg', `GID=${id('GID')}`, '--label', `${LABEL}=${fingerprint()}`, CONTEXT],
    { cwd: repoRoot, stdio: 'inherit' }
  );
  if (status !== 0) process.exit(status ?? 1);
};

// Services à recréer : ceux qui tournent sur l'image du socle. `docker inspect
// .Config.Image` donne la référence DÉCLARÉE du conteneur (« tet-node-dev »),
// contrairement au champ Image de `compose ps` qui bascule sur le sha dès que
// le tag a été réattribué — c'est-à-dire précisément après un rebuild.
const servicesOnBaseImage = (): string[] => {
  const ids = composeLines([
    '--profile',
    '*',
    'ps',
    '--status',
    'running',
    '-q',
  ]);
  if (!ids.length) return [];
  const rows = execFileSync(
    DOCKER,
    // prettier-ignore
    ['inspect', '--format', `{{.Config.Image}} {{index .Config.Labels "com.docker.compose.service"}}`, ...ids],
    { encoding: 'utf8' }
  );
  return rows
    .split('\n')
    .filter((l) => l.startsWith(`${IMAGE} `))
    .map((l) => l.split(' ')[1]);
};

/** Reconstruit puis recrée les conteneurs qui tournaient sur l'ancienne image. */
export const swap = (): void => {
  build();
  const services = servicesOnBaseImage();
  if (!services.length) return;
  console.error(`🔄 recréation sur le nouveau socle : ${services.join(', ')}`);
  // --no-deps : seuls ces conteneurs sont recréés, l'infra sous eux ne bouge pas.
  compose([
    '--profile',
    '*',
    'up',
    '-d',
    '--no-deps',
    '--force-recreate',
    '--wait',
    ...services,
  ]);
};

/** Détache le swap (apt + toolchain : plusieurs minutes) et rend la main. */
export const rebuildInBackground = (): void => {
  const log = openSync(`${repoRoot}/${LOG}`, 'w');
  const child = spawn(
    process.execPath,
    [fileURLToPath(import.meta.url), 'swap'],
    { cwd: repoRoot, detached: true, stdio: ['ignore', log, log] }
  );
  child.unref();
  console.error(
    `🛠 socle des apps obsolète — reconstruction en tâche de fond (${LOG}), les apps redémarreront dessus`
  );
};

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  switch (process.argv[2]) {
    case 'build':
      build();
      break;
    case 'swap':
      swap();
      break;
    case 'rebuild':
      rebuildInBackground();
      break;
    case 'state':
      process.stdout.write(state());
      break;
    default:
      console.error(
        'usage : node scripts/node-base.mts <build|swap|rebuild|state>'
      );
      process.exit(1);
  }
}
