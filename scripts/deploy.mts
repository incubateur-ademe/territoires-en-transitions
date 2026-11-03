// Déploiement sans la CI GitHub — le corps de `make deploy`.
// Construit l'image d'une ou plusieurs apps depuis une branche et la déploie
// sur Koyeb, à l'identique des workflows cd-*.yml : même tag (hash court du
// commit), mêmes build-args et secret, linux/amd64, même registre ghcr.
// Sources de vérité : .github/actions/docker/build-push/action.yml et
// .github/actions/app/build-metadata/action.yml.
//
// Ce que ce script ne fait PAS : toucher aux variables d'environnement du
// service (il les signale si le workflow en déclare qui manquent) ni jouer les
// migrations sqitch (il prévient si la branche en ajoute).
//
// Options relayées par le Makefile : --app backend,app --env prod
// --branch main --rebuild --yes --dry-run.
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import prompts from 'prompts';

type Env = 'preprod' | 'staging' | 'prod';

type Target = {
  label: string;
  /** Nom de l'image et du cache sur ghcr (tet-<…>). */
  image: string;
  dockerfile: string;
  workflow: string;
  /** Service Koyeb sans le préfixe d'environnement, tel qu'écrit dans le
   * workflow après `$ENV_NAME-`. */
  koyebService: string;
  envs: Env[];
  /** Chemins qui changent l'image : sans commit dessus, rien à déployer. */
  paths: string[];
};

const ROOT_PATHS = ['package.json', 'pnpm-lock.yaml'];

const TARGETS: Record<string, Target> = {
  backend: {
    label: 'Backend (API)',
    image: 'tet-backend',
    dockerfile: 'apps/backend/Dockerfile',
    workflow: '.github/workflows/cd-backend.yml',
    koyebService: 'backend/backend',
    envs: ['preprod', 'staging', 'prod'],
    paths: ['apps/backend', 'packages/domain', 'data_layer', ...ROOT_PATHS],
  },
  app: {
    label: 'App (front)',
    image: 'tet-app',
    dockerfile: 'apps/app/Dockerfile',
    workflow: '.github/workflows/cd-app.yml',
    koyebService: 'app/front',
    envs: ['preprod', 'staging', 'prod'],
    paths: ['apps/app', 'packages', ...ROOT_PATHS],
  },
  site: {
    label: 'Site public',
    image: 'tet-site',
    dockerfile: 'apps/site/Dockerfile',
    workflow: '.github/workflows/cd-site.yml',
    koyebService: 'site/front',
    envs: ['preprod', 'staging', 'prod'],
    paths: ['apps/site', 'packages', ...ROOT_PATHS],
  },
  tools: {
    label: "Tools (API d'automatisation)",
    image: 'tet-tools',
    dockerfile: 'apps/tools/Dockerfile',
    workflow: '.github/workflows/cd-tools.yml',
    koyebService: 'tools-autom-api/tools',
    envs: ['staging', 'prod'],
    paths: ['apps/tools', 'apps/backend', 'packages', ...ROOT_PATHS],
  },
};

const REGISTRY = 'ghcr.io/incubateur-ademe';
const REPOSITORY = 'incubateur-ademe/territoires-en-transitions';
const BUILDER = 'tet-local-builder';
const POLL_INTERVAL_MS = 10_000;
const POLL_TIMEOUT_MS = 10 * 60_000;

const serviceOf = (target: Target, env: Env) =>
  `${env}-${target.koyebService}`;

// ——— Affichage ———————————————————————————————————————————————————————————————
const color = (code: number) => (text: string) =>
  `\x1b[${code}m${text}\x1b[0m`;
const bold = color(1);
const dim = color(2);
const red = color(31);
const green = color(32);
const yellow = color(33);
const blue = color(34);

const step = (text: string) => console.log(`\n${bold(blue(`▶ ${text}`))}`);
const warn = (text: string) => console.log(yellow(`  ⚠ ${text}`));
const fail = (text: string): never => {
  console.error(`\n${red(`✗ ${text}`)}`);
  process.exit(1);
};

// ——— Commandes ———————————————————————————————————————————————————————————————
type RunOptions = { input?: string; inherit?: boolean; cwd?: string };

/** Lance une commande ; renvoie stdout, ou null si elle échoue. */
const tryRun = (
  command: string,
  args: string[],
  { input, inherit, cwd }: RunOptions = {}
): string | null => {
  const { status, stdout } = spawnSync(command, args, {
    cwd,
    input,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: inherit
      ? [input === undefined ? 'inherit' : 'pipe', 'inherit', 'inherit']
      : ['pipe', 'pipe', 'pipe'],
  });
  return status === 0 ? (stdout ?? '').trim() : null;
};

const run = (command: string, args: string[], options?: RunOptions): string =>
  tryRun(command, args, options) ??
  fail(`échec de : ${command} ${args.join(' ')}`);

function koyebJson<T>(args: string[]): T {
  return JSON.parse(run('koyeb', [...args, '-o', 'json'])) as T;
}

type KoyebService = {
  active_deployment_id: string;
  latest_deployment_id: string;
};
type KoyebDeployment = {
  status: string;
  definition: { docker?: { image?: string }; env?: { key: string }[] };
};

// ——— 1. Choix ————————————————————————————————————————————————————————————————
const { values: options } = parseArgs({
  options: {
    app: { type: 'string' },
    env: { type: 'string' },
    branch: { type: 'string' },
    rebuild: { type: 'boolean', default: false },
    yes: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
});

if (options.help) {
  console.log(`make deploy [app=backend,app] [env=prod] [branch=main] [rebuild=1] [yes=1] [dry=1]
  app     ${Object.keys(TARGETS).join(', ')} (plusieurs, séparées par des virgules)
  env     preprod, staging, prod
  branch  branche distante (origin/<branch>)
  rebuild reconstruire même si la CI a déjà publié l'image de ce commit
  yes     ne pas demander de confirmation
  dry     récapitulatif seulement, ni build ni déploiement`);
  process.exit(0);
}

const root = run('git', ['rev-parse', '--show-toplevel']);
process.chdir(root);

const onCancel = () => process.exit(1);

const appNames: string[] = options.app
  ? options.app.split(',').map((name) => name.trim())
  : (
      await prompts(
        {
          type: 'multiselect',
          name: 'apps',
          message: 'Quelles apps déployer ?',
          choices: Object.entries(TARGETS).map(([value, target]) => ({
            title: target.label,
            value,
          })),
          min: 1,
          instructions: false,
          hint: 'espace pour cocher, entrée pour valider',
        },
        { onCancel }
      )
    ).apps;

const unknown = appNames.filter((name) => !TARGETS[name]);
if (unknown.length)
  fail(
    `app inconnue : ${unknown.join(', ')} (au choix : ${Object.keys(
      TARGETS
    ).join(', ')})`
  );

const possibleEnvs = (['preprod', 'staging', 'prod'] as Env[]).filter((env) =>
  appNames.every((name) => TARGETS[name].envs.includes(env))
);

const env: Env = (options.env as Env | undefined) ??
  (
    await prompts(
      {
        type: 'select',
        name: 'env',
        message: 'Quel environnement ?',
        choices: possibleEnvs.map((value) => ({ title: value, value })),
        initial: possibleEnvs.indexOf('staging'),
      },
      { onCancel }
    )
  ).env;
if (!possibleEnvs.includes(env))
  fail(`environnement ${env} impossible pour ${appNames.join(', ')}`);

const remoteBranches = run('git', [
  'for-each-ref',
  '--sort=-committerdate',
  '--format=%(refname:lstrip=3)',
  'refs/remotes/origin',
])
  .split('\n')
  .filter((name) => name && name !== 'HEAD');

const branch: string = options.branch ??
  (
    await prompts(
      {
        type: 'autocomplete',
        name: 'branch',
        message: 'Quelle branche ? (origin/…)',
        choices: [
          'main',
          ...remoteBranches.filter((name) => name !== 'main'),
        ].map((name) => ({ title: name, value: name })),
        suggest: async (input: string, choices: { title: string }[]) =>
          choices.filter((choice) => choice.title.includes(input)),
      },
      { onCancel }
    )
  ).branch;

// ——— 2. Prérequis ————————————————————————————————————————————————————————————
step('Prérequis');
const ghStatus = tryRun('gh', ['auth', 'status']) ?? '';
if (!options['dry-run'] && !ghStatus.includes('write:packages'))
  fail(
    "le jeton gh n'a pas le droit write:packages, nécessaire pour pousser l'image :\n  gh auth refresh -h github.com -s write:packages"
  );
if (!options['dry-run'] && tryRun('docker', ['buildx', 'version']) === null)
  fail('docker buildx est introuvable');
const bryntumToken = (process.env.BRYNTUM_ACCESS_TOKEN ?? '').trim();
if (!options['dry-run'] && (!bryntumToken || bryntumToken.startsWith('encrypted:')))
  fail(
    'BRYNTUM_ACCESS_TOKEN vide ou chiffré : lancer par make deploy (déchiffrement dotenvx, .env.keys requis)'
  );
for (const name of appNames)
  if (tryRun('koyeb', ['services', 'get', serviceOf(TARGETS[name], env)]) === null)
    fail(
      `service Koyeb ${serviceOf(TARGETS[name], env)} introuvable (koyeb login ?)`
    );
console.log(green('  ✓ gh, docker buildx, koyeb, jeton Bryntum'));

// ——— 3. Commit ———————————————————————————————————————————————————————————————
step(`Commit à déployer : origin/${branch}`);
run('git', ['fetch', '--quiet', 'origin', branch]);
const sha = run('git', ['rev-parse', `origin/${branch}`]);
// 9 caractères, comme `git rev-parse --short` dans le clone de la CI : c'est
// ce qui permet de reconnaître (et réutiliser) les images qu'elle a publiées.
const shortSha = run('git', ['rev-parse', '--short=9', sha]);
const commitTimestamp = run('git', ['show', '-s', '--format=%cI', sha]);
const applicationVersion = run('git', ['describe', '--tags', '--always', sha]);
console.log(`  ${run('git', ['log', '-1', '--format=%h %s (%an, %cr)', sha])}`);

// ——— 4. Récapitulatif ————————————————————————————————————————————————————————
type Plan = {
  name: string;
  target: Target;
  service: string;
  image: string;
  currentImage: string;
  upToDate: boolean;
};

/** Noms des variables que le workflow passe à `koyeb services update`. */
const workflowEnvNames = (target: Target): string[] => {
  const lines = readFileSync(target.workflow, 'utf8').split('\n');
  const start = lines.findIndex((line) =>
    line.includes(`koyeb services update $ENV_NAME-${target.koyebService}`)
  );
  if (start < 0) return [];
  const names: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.trim().startsWith('--')) break;
    const match = line.match(/--env\s+"?([A-Z0-9_]+)=/);
    if (match) names.push(match[1]);
  }
  return names;
};

const plans: Plan[] = appNames.map((name) => {
  const target = TARGETS[name];
  const service = serviceOf(target, env);
  const image = `${REGISTRY}/${target.image}:${shortSha}`;
  const { active_deployment_id, latest_deployment_id } =
    koyebJson<KoyebService>(['services', 'get', service]);
  const current = koyebJson<KoyebDeployment>([
    'deployments',
    'get',
    active_deployment_id,
  ]);
  // `services update` repart du dernier déploiement, même en échec, pas de
  // l'actif : c'est lui qui dit quelles variables partiront.
  const latest =
    latest_deployment_id === active_deployment_id
      ? current
      : koyebJson<KoyebDeployment>(['deployments', 'get', latest_deployment_id]);
  const currentImage = current.definition.docker?.image ?? '(inconnue)';
  const deployedSha =
    tryRun('git', [
      'rev-parse',
      '--verify',
      '--quiet',
      `${currentImage.split(':').at(-1)}^{commit}`,
    ]) ?? '';

  step(`${target.label} → ${service}`);
  console.log(`  image actuelle : ${currentImage}`);
  console.log(`  image visée    : ${image}`);

  let upToDate = deployedSha === sha;
  if (upToDate) console.log(green('  ✓ ce commit est déjà déployé'));
  else if (deployedSha) {
    const log = run('git', [
      'log',
      '--oneline',
      '--no-merges',
      `${deployedSha}..${sha}`,
      '--',
      ...target.paths,
    ]);
    const count = log ? log.split('\n').length : 0;
    const isAncestor =
      tryRun('git', ['merge-base', '--is-ancestor', deployedSha, sha]) !== null;
    if (count === 0 && isAncestor) {
      upToDate = true;
      console.log(
        green(`  ✓ aucun changement pour cette app depuis la version déployée`)
      );
    } else
      console.log(`  ${count} commit(s) touchant ${target.paths.join(', ')} :`);
    for (const line of log.split('\n').filter(Boolean).slice(0, 15))
      console.log(dim(`    ${line}`));
    if (count > 15) console.log(dim(`    … et ${count - 15} autres`));
    if (
      tryRun('git', ['merge-base', '--is-ancestor', sha, deployedSha]) !== null
    )
      warn(`la cible est plus ANCIENNE que la version déployée (retour arrière)`);
    if (name === 'backend') {
      const migrations = run('git', [
        'diff',
        '--name-only',
        `${deployedSha}..${sha}`,
        '--',
        'data_layer/sqitch/sqitch.plan',
      ]);
      if (migrations)
        warn(
          'sqitch.plan a changé : les migrations ne sont PAS jouées par le déploiement (sqitch deploy à la main, avant si le code en dépend)'
        );
    }
  } else
    warn(
      `commit de l'image actuelle introuvable en local : comparaison impossible`
    );

  const present = new Set((latest.definition.env ?? []).map((e) => e.key));
  const missing = workflowEnvNames(target).filter((key) => !present.has(key));
  if (missing.length)
    warn(
      `variables déclarées dans ${target.workflow} absentes du service : ${missing.join(
        ', '
      )} — ce script ne les pose pas (Koyeb ou CI)`
    );

  return { name, target, service, image, currentImage, upToDate };
});

const toDeploy = plans.filter((plan) => !plan.upToDate || options.rebuild);
if (!toDeploy.length) {
  console.log(`\n${green('✓ tout est déjà déployé, rien à faire')}`);
  process.exit(0);
}
if (options['dry-run']) {
  console.log(`\n${dim('dry-run : ni build ni déploiement')}`);
  process.exit(0);
}

if (!options.yes) {
  const { confirmed } = await prompts(
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Déployer ${toDeploy
        .map((plan) => plan.name)
        .join(', ')} (${shortSha}) sur ${env} ?`,
      initial: false,
    },
    { onCancel }
  );
  if (!confirmed) fail('abandon');
  if (env === 'prod' && branch !== 'main') {
    const { typed } = await prompts(
      {
        type: 'text',
        name: 'typed',
        message: `Branche ${branch} en PROD, hors main : retapez le nom de la branche pour confirmer`,
      },
      { onCancel }
    );
    if (typed !== branch) fail('abandon');
  }
}

// ——— 5. Build ————————————————————————————————————————————————————————————————
const workdir = mkdtempSync(join(tmpdir(), 'tet-deploy-'));
const cleanup = () => rmSync(workdir, { recursive: true, force: true });
process.on('exit', cleanup);
process.on('SIGINT', () => process.exit(130));

step(`Contexte de build : fichiers suivis de ${shortSha}`);
const context = join(workdir, 'context');
mkdirSync(context);
run('sh', ['-c', 'git archive "$1" | tar -x -C "$2"', 'sh', sha, context]);

// Le secret passe par un fichier privé, comme en CI (cf. build-push).
const secretFile = join(workdir, 'bryntum_token');
writeFileSync(secretFile, bryntumToken, { mode: 0o600 });

step('Connexion à ghcr.io');
run(
  'docker',
  [
    'login',
    'ghcr.io',
    '-u',
    run('gh', ['api', 'user', '-q', '.login']),
    '--password-stdin',
  ],
  { input: run('gh', ['auth', 'token']) }
);
if (tryRun('docker', ['buildx', 'inspect', BUILDER]) === null)
  run('docker', [
    'buildx',
    'create',
    '--name',
    BUILDER,
    '--driver',
    'docker-container',
  ]);

/** L'image existe et la CI l'a attestée pour ce commit : inutile de reconstruire. */
const isPublishedByCi = (image: string): boolean =>
  tryRun('docker', ['buildx', 'imagetools', 'inspect', image]) !== null &&
  tryRun('gh', [
    'attestation',
    'verify',
    `oci://${image}`,
    '--repo',
    REPOSITORY,
    '--source-digest',
    sha,
  ]) !== null;

for (const plan of toDeploy) {
  if (!options.rebuild && isPublishedByCi(plan.image)) {
    step(`${plan.image} déjà publiée et attestée par la CI : pas de build`);
    continue;
  }
  step(`Build et push de ${plan.image}`);
  const cache = `${REGISTRY}/${plan.target.image}:buildcache-${plan.target.image}`;
  run(
    'docker',
    [
      'buildx',
      'build',
      '--builder',
      BUILDER,
      '--platform',
      'linux/amd64',
      '-f',
      plan.target.dockerfile,
      '--build-arg',
      `GIT_SHORT_HASH=${shortSha}`,
      '--build-arg',
      `GIT_COMMIT_TIMESTAMP=${commitTimestamp}`,
      '--build-arg',
      `APPLICATION_VERSION=${applicationVersion}`,
      '--secret',
      `id=bryntum_token,src=${secretFile}`,
      '--cache-from',
      `type=registry,ref=${cache}`,
      '-t',
      plan.image,
      '--push',
      '.',
    ],
    { inherit: true, cwd: context }
  );
}

// ——— 6. Déploiement ——————————————————————————————————————————————————————————
for (const plan of toDeploy) {
  step(`Déploiement de ${plan.image} sur ${plan.service}`);
  run('koyeb', [
    'services',
    'update',
    plan.service,
    '--docker',
    plan.image,
    '--docker-private-registry-secret',
    'ghcr',
    '--docker-skip-verify',
  ]);
}

// ——— 7. Suivi ————————————————————————————————————————————————————————————————
step('Attente des déploiements');
const pending = new Map(toDeploy.map((plan) => [plan.service, plan]));
const failed: Plan[] = [];
const rollback = (plan: Plan) =>
  `koyeb services update ${plan.service} --docker ${plan.currentImage} --docker-private-registry-secret ghcr --docker-skip-verify`;
const deadline = Date.now() + POLL_TIMEOUT_MS;

while (pending.size && Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  for (const [service, plan] of pending) {
    const latest = koyebJson<KoyebService>([
      'services',
      'get',
      service,
    ]).latest_deployment_id;
    const { status } = koyebJson<KoyebDeployment>([
      'deployments',
      'get',
      latest,
    ]);
    console.log(dim(`  ${service} : ${status}`));
    if (status === 'HEALTHY') {
      console.log(green(`  ✓ ${service} déployé (${plan.image})`));
      pending.delete(service);
    } else if (['ERROR', 'UNHEALTHY', 'CANCELED', 'STOPPED'].includes(status)) {
      console.log(red(`  ✗ ${service} : ${status} — koyeb deployments logs ${latest}`));
      failed.push(plan);
      pending.delete(service);
    }
  }
}

for (const plan of [...failed, ...pending.values()])
  console.log(yellow(`  retour arrière : ${rollback(plan)}`));
if (pending.size)
  fail(`toujours en cours après 10 minutes : ${[...pending.keys()].join(', ')}`);
if (failed.length) fail('déploiement en échec');
console.log(`\n${green(bold('✓ déploiement terminé'))}`);
for (const plan of toDeploy)
  console.log(dim(`  retour arrière ${plan.name} : ${rollback(plan)}`));
