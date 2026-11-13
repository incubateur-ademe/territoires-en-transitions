import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { createTRPCClient, httpLink, TRPCClientError } from '@trpc/client';
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

const USAGE = `Usage : node apps/backend/src/plans/plans/electrification/publish-electrification-data/run-publish-electrification-data.ts <prepare|export|verify|publish>
  --backend-url <url> --token-file <fichier> --kind <catalogue|laureats> --file <json>
  [--version <version>] (export ou prepare)
  [--valid-from <YYYY-MM-DD>] (prepare --kind laureats)

prepare : lit la source métier, vérifie et écrit un fichier à relire ; ne publie rien.
export  : écrit la version active (ou demandée) dans un nouveau fichier JSON.
verify  : vérifie le fichier dans l'environnement cible, sans le publier.
publish : vérifie puis publie le fichier ; active cette version pour les nouveaux usages.

Le fichier de session contient le seul access token d'un utilisateur SUPER_ADMIN.
Il n'est jamais affiché. HTTPS est requis hors localhost. Aucun appel IA.`;

type Command = 'prepare' | 'export' | 'verify' | 'publish';
type Options = {
  command: Command;
  backendUrl: URL;
  tokenFile: string;
  kind: 'catalogue' | 'laureats';
  file: string;
  version?: string;
  validFrom?: string;
};

/** Seuls ces messages locaux, sans contenu de fichier/session, sont affichés. */
class CommandInputError extends Error {}

function readOptions(): Options | null {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      'backend-url': { type: 'string' },
      'token-file': { type: 'string' },
      kind: { type: 'string' },
      file: { type: 'string' },
      version: { type: 'string' },
      'valid-from': { type: 'string' },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) return null;
  const [command] = positionals;
  if (
    positionals.length !== 1 ||
    !['prepare', 'export', 'verify', 'publish'].includes(command) ||
    !values['backend-url'] ||
    !values['token-file'] ||
    !values.file ||
    (values.kind !== 'catalogue' && values.kind !== 'laureats')
  ) {
    throw new CommandInputError(
      'Options manquantes ou invalides. Voir --help.'
    );
  }
  const preparing = command === 'prepare';
  if (preparing && !values.version?.trim()) {
    throw new CommandInputError('prepare exige --version.');
  }
  if (
    preparing &&
    values.kind === 'laureats' &&
    !values['valid-from']?.match(/^\d{4}-\d{2}-\d{2}$/)
  ) {
    throw new CommandInputError(
      'prepare --kind laureats exige --valid-from YYYY-MM-DD.'
    );
  }
  if (values.version !== undefined && command !== 'export' && !preparing) {
    throw new CommandInputError('--version est réservé à export ou prepare.');
  }
  const backendUrl = new URL(values['backend-url']);
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(
    backendUrl.hostname
  );
  if (
    (backendUrl.protocol !== 'https:' &&
      !(backendUrl.protocol === 'http:' && isLocal)) ||
    backendUrl.username ||
    backendUrl.password ||
    backendUrl.search ||
    backendUrl.hash ||
    backendUrl.pathname !== '/'
  ) {
    throw new CommandInputError(
      '--backend-url doit être une origine HTTPS (HTTP autorisé sur localhost), sans identifiants ni chemin.'
    );
  }
  return {
    command: command as Command,
    backendUrl,
    tokenFile: values['token-file'],
    kind: values.kind,
    file: values.file,
    version: values.version,
    validFrom: values['valid-from'],
  };
}

async function readData(file: string): Promise<unknown> {
  const content = await readFile(file, 'utf8');
  try {
    return JSON.parse(content);
  } catch {
    throw new CommandInputError(
      'Le fichier de données ne contient pas du JSON valide.'
    );
  }
}

async function run(options: Options): Promise<number> {
  const token = (await readFile(options.tokenFile, 'utf8')).trim();
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) {
    throw new CommandInputError(
      'Le fichier de session doit contenir uniquement un access token JWT.'
    );
  }
  const client = createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: new URL('/trpc', options.backendUrl).href,
        headers: { Authorization: `Bearer ${token}` },
        fetch: (url, init) =>
          fetch(url, {
            ...init,
            redirect: 'error',
            signal: AbortSignal.timeout(60_000),
          }),
      }),
    ],
  }).plans.plans.electrificationData;

  if (options.command === 'prepare') {
    const prepared = await client.prepare.mutate(
      options.kind === 'catalogue'
        ? { kind: options.kind, version: options.version ?? '' }
        : {
            kind: options.kind,
            version: options.version ?? '',
            validFrom: `${options.validFrom}T00:00:00.000Z`,
          }
    );
    if (!prepared.valid) {
      process.stdout.write(
        `${JSON.stringify(
          { valid: false, issues: prepared.issues },
          null,
          2
        )}\n`
      );
      return 1;
    }
    await writeFile(
      options.file,
      `${JSON.stringify(prepared.data, null, 2)}\n`,
      { flag: 'wx' }
    );
    process.stdout.write(
      'Source vérifiée et fichier préparé. Relisez les changements avant publication.\n'
    );
    return 0;
  }

  if (options.command === 'export') {
    const data = await client.get.query({
      kind: options.kind,
      version: options.version,
    });
    await writeFile(options.file, `${JSON.stringify(data, null, 2)}\n`, {
      flag: 'wx',
    });
    process.stdout.write('Export terminé.\n');
    return 0;
  }

  const input = { kind: options.kind, data: await readData(options.file) };
  const verification = await client.verify.mutate(input);
  if (!verification.valid) {
    process.stdout.write(`${JSON.stringify(verification, null, 2)}\n`);
    return 1;
  }
  if (options.command === 'verify') {
    process.stdout.write(
      'Données valides dans cet environnement ; aucune publication.\n'
    );
    return 0;
  }

  const published = await client.publish.mutate(input);
  process.stdout.write(`Version active : ${published.version}\n`);
  return 0;
}

async function main(): Promise<number> {
  const options = readOptions();
  if (!options) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  return run(options);
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    const message =
      error instanceof CommandInputError
        ? error.message
        : error instanceof TRPCClientError
        ? `Échec API (${
            error.data?.code ?? 'réseau'
          }). Vérifier les droits, la configuration des sources et les logs du backend.`
        : 'Commande impossible. Vérifier les options (--help), les accès aux fichiers et au backend ; export exige un fichier de destination inexistant.';
    // Ne jamais afficher l'objet d'erreur HTTP : il peut contenir la session.
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
);
