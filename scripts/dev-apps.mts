// Registre des apps de dev — port, besoins d'infra — et sélection PARTAGÉE
// entre make up (conteneurs) et make dev (hôte) : COMPOSE_PROFILES dans
// .env.local (convention native compose), mémorisée par le picker
// (scripts/pick-stack.mts). Importable (pick-stack) et exécutable :
//   node scripts/dev-apps.mts <apps|infra|run|has-app> [apps…]
// UI sur stderr, résultat sur stdout (capturé par le Makefile).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { readEnvValue, writeEnvValue } from './env-local.mts';

// port : port d'écoute par défaut ; infra : profils compose requis pour que
// l'app tourne.
interface AppDef {
  port: number;
  infra: string[];
}

interface InfraComponent {
  value: string;
  title: string;
}

export const APPS: Record<string, AppDef> = {
  app: { port: 3000, infra: ['supabase'] },
  site: { port: 3001, infra: ['supabase', 'strapi'] },
  panier: { port: 3002, infra: ['supabase'] },
  backend: { port: 8080, infra: ['supabase', 'redis'] },
  tools: { port: 8081, infra: ['supabase', 'redis'] },
};

// Apps lancées quand rien n'est précisé (celles de `pnpm dev`) — tools exclu :
// il exige un env complet (Airtable, Notion…) et reste sélectionnable
// explicitement.
export const DEFAULT_APPS: string[] = ['app', 'panier', 'site', 'backend'];

// Composants d'infra proposés par le picker (un profil compose chacun) et
// dépendances entre profils — docker compose refuse un depends_on vers un
// service dont le profil est inactif.
export const INFRA_COMPONENTS: InfraComponent[] = [
  {
    value: 'supabase',
    title: 'Supabase (db, kong, gotrue, rest, realtime, storage, mailpit)',
  },
  { value: 'studio', title: 'Supabase Studio (localhost:54323)' },
  { value: 'redis', title: 'Redis (localhost:6379)' },
  { value: 'strapi', title: 'Strapi + sa base Postgres (localhost:1337)' },
  {
    value: 'functions',
    title: 'Edge functions Deno (formulaire de contact du site)',
  },
];

export const REQUIRES: Record<string, string[]> = {
  studio: ['supabase'],
  functions: ['supabase'],
  ...Object.fromEntries(
    Object.entries(APPS).map(([app, { infra }]) => [app, infra])
  ),
};

const ENV_LOCAL = '.env.local';
const INFRA_VALUES = new Set(INFRA_COMPONENTS.map((c) => c.value));

const appsOrFail = (names: string[]): string[] => {
  const unknown = names.filter((n) => !APPS[n]);
  if (unknown.length) {
    console.error(
      `✗ app(s) inconnue(s) : ${unknown.join(', ')} — apps : ${Object.keys(APPS).join(', ')}`
    );
    process.exit(1);
  }
  return names;
};

const savedProfiles = (): string[] =>
  readEnvValue(ENV_LOCAL, 'COMPOSE_PROFILES')
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

// Apps effectives de `make dev` : apps= explicites (persistées dans la
// sélection partagée, composants d'infra déjà cochés conservés) > sélection
// mémorisée > picker (TTY) > erreur explicite (agents).
const resolveApps = (args: string[]): string[] => {
  const requested = args
    .flatMap((a) => a.split(','))
    .map((s) => s.trim())
    .filter(Boolean);
  if (requested.length) {
    const apps = [...new Set(appsOrFail(requested))];
    const infraExtras = savedProfiles().filter((p) => INFRA_VALUES.has(p));
    const derived = apps.flatMap((a) => APPS[a].infra);
    writeEnvValue(
      ENV_LOCAL,
      'COMPOSE_PROFILES',
      [...new Set([...infraExtras, ...derived, ...apps])].join(',')
    );
    return apps;
  }
  // héritage : l'ancien profil « apps » (conteneur unique) = les apps par défaut
  const saved = [
    ...new Set(
      savedProfiles()
        .flatMap((p) => (p === 'apps' ? DEFAULT_APPS : p))
        .filter((p) => APPS[p])
    ),
  ];
  if (saved.length) return saved;
  if (process.stderr.isTTY) {
    const picked = spawnSync('node', ['scripts/pick-stack.mts'], {
      stdio: ['inherit', 'pipe', 'inherit'],
      encoding: 'utf8',
    });
    if (picked.status !== 0) process.exit(picked.status ?? 1);
    const apps = picked.stdout
      .trim()
      .split(',')
      .filter((p) => APPS[p]);
    if (apps.length) return apps;
    console.error('✗ aucune app cochée — rien à lancer sur l’hôte');
    process.exit(1);
  }
  console.error(
    `✗ pas de TTY et pas de sélection mémorisée — précisez make dev apps=<${Object.keys(APPS).join(',')}…>`
  );
  process.exit(1);
};

// Profils d'infra à démarrer pour ces apps : leurs besoins + les composants
// d'infra déjà cochés dans la sélection (ex. studio).
const infraFor = (apps: string[]): string[] => [
  ...new Set([
    ...savedProfiles().filter((p) => INFRA_VALUES.has(p)),
    ...appsOrFail(apps).flatMap((a) => APPS[a].infra),
  ]),
];

// Flags dotenvx : le .env de chaque app (+ variantes .local si présentes),
// puis le .env racine — le .local, chargé avant, gagne (premier arrivé).
const envFlags = (apps: string[]): string[] => {
  const files = [...apps.map((a) => `apps/${a}/.env`), '.env'];
  return files
    .flatMap((f) => [`${f}.local`, f])
    .filter((f) => existsSync(f))
    .flatMap((f) => ['-f', f]);
};

// Échoue si un port des apps demandées est déjà occupé : Next glisserait en
// silence vers un port voisin et fausserait les URLs inter-apps. Le port
// effectif tient compte des décalages par worktree (*_PORT dans .env.local).
const checkPorts = async (apps: string[]): Promise<void> => {
  const net = await import('node:net');
  const busy: string[] = [];
  await Promise.all(
    apps.map(
      (p) =>
        new Promise<void>((done) => {
          const envVar = `${p.toUpperCase()}_PORT`;
          const port = Number(
            process.env[envVar] ??
              readEnvValue(ENV_LOCAL, envVar) ??
              APPS[p].port
          );
          const sock = net.connect({ port, host: '127.0.0.1' });
          const finish = (isBusy: boolean) => {
            sock.destroy();
            if (isBusy) busy.push(`${p} (:${port})`);
            done();
          };
          sock.once('connect', () => finish(true));
          sock.once('error', () => finish(false));
          sock.setTimeout(300, () => finish(false));
        })
    )
  );
  if (busy.length) {
    console.error(
      `✗ port(s) déjà occupé(s) : ${busy.join(', ')} — un autre make dev tourne ?`
    );
    process.exit(1);
  }
};

// Lance les apps sur l'hôte : vérification des ports, puis dotenvx (env
// déchiffré) + nx run-many, dans un seul process node (DOTENVX surchargable
// par le Makefile).
const run = async (apps: string[]): Promise<void> => {
  appsOrFail(apps);
  await checkPorts(apps);
  const dotenvx = (process.env.DOTENVX ?? 'npx -y @dotenvx/dotenvx').split(' ');
  const { status } = spawnSync(
    dotenvx[0],
    [
      ...dotenvx.slice(1),
      'run',
      '--env-keys-file=.env.keys',
      ...envFlags(apps),
      '--',
      'pnpm',
      'exec',
      'nx',
      'run-many',
      '--parallel',
      String(Math.max(3, apps.length)),
      '-t',
      'dev',
      '-p',
      ...apps,
    ],
    { stdio: 'inherit' }
  );
  process.exit(status ?? 1);
};

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case 'apps':
      process.stdout.write(resolveApps(args).join(' '));
      break;
    case 'infra':
      process.stdout.write(infraFor(args).join(','));
      break;
    case 'run':
      await run(args);
      break;
    case 'has-app': {
      // exit 0 si la liste de profils contient au moins une app conteneurisée
      // (déclencheur du preflight inotify de make up).
      const profiles = (args[0] ?? '').split(',').map((s) => s.trim());
      process.exit(profiles.some((p) => APPS[p]) ? 0 : 1);
      break;
    }
    default:
      console.error(
        'usage : node scripts/dev-apps.mts <apps|infra|run|has-app> [apps…]'
      );
      process.exit(1);
  }
}
