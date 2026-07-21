// Sélecteur interactif des composants de la stack locale pour `make up`.
// Affiche une liste à cocher (services + apps, un profil docker compose par
// composant), complète automatiquement les dépendances entre profils, persiste
// la sélection dans .env.local (COMPOSE_PROFILES, convention native compose)
// et écrit la valeur sur stdout pour que le Makefile la capture ; l'UI passe
// par stderr. Sans TTY, ressort la dernière sélection sans prompt.
// `--profile <nom>` : applique un profile enregistré (TET_STACK_PROFILES,
// sauvé par x dans make tui) sans prompt — voie de `make up p="<nom>"`.
import prompts from 'prompts';
import {
  APPS,
  DEFAULT_APPS,
  INFRA_COMPONENTS,
  REQUIRES,
} from './dev-apps.mts';
import { readEnvValue, writeEnvValue } from './env-local.mts';
import { readStackProfiles } from './stack-profiles.mts';

const ENV_LOCAL = '.env.local';

const COMPONENTS = [
  ...INFRA_COMPONENTS,
  ...Object.entries(APPS).map(([app, { port }]) => ({
    value: app,
    title: `App ${app} — nx dev en conteneur (localhost:${port})`,
  })),
];

// Par défaut : toute l'infra + les apps de `pnpm dev` — exclus mais cochables :
// tools (exige un env complet Airtable/Notion, crash-loop sinon) et functions
// (edge functions rarement utiles ; kong répond 503 sur /functions/v1/ sinon).
const DEFAULT_SELECTION = [
  ...INFRA_COMPONENTS.map((c) => c.value).filter((v) => v !== 'functions'),
  ...DEFAULT_APPS,
];

const KNOWN = new Set(COMPONENTS.map((c) => c.value));

const readSaved = (): string[] | null => {
  const values = readEnvValue(ENV_LOCAL, 'COMPOSE_PROFILES')
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!values) return null;
  // Héritage : l'ancien profil « apps » (conteneur unique) lançait `pnpm dev`
  // = les apps par défaut — PAS tools (env spécifique requis). Les valeurs
  // inconnues (profils disparus) sont écartées plutôt que de produire une
  // sélection vide qui stopperait toute la stack.
  const sane = values
    .flatMap((v) => (v === 'apps' ? DEFAULT_APPS : v))
    .filter((v) => KNOWN.has(v));
  return sane.length ? sane : null;
};

const save = (profiles: string[]): void =>
  writeEnvValue(ENV_LOCAL, 'COMPOSE_PROFILES', profiles.join(','));

const withRequirements = (selection: string[]): string[] => {
  const result = new Set(selection);
  for (const component of selection) {
    for (const required of REQUIRES[component] ?? []) {
      if (!result.has(required)) {
        result.add(required);
        console.error(`  ↳ ${required} ajouté (requis par ${component})`);
      }
    }
  }
  // conserve l'ordre d'affichage des composants
  return COMPONENTS.map((c) => c.value).filter((v) => result.has(v));
};

const saved = readSaved() ?? DEFAULT_SELECTION;

const profileFlagAt = process.argv.indexOf('--profile');
const profileArg = profileFlagAt >= 0 ? process.argv[profileFlagAt + 1] : null;

let selection: string[] | undefined;
// `profileFlagAt >= 0` (pas `profileArg != null`) : `--profile` en dernière
// position, sans valeur, doit échouer explicitement plutôt que retomber en
// silence sur la sélection mémorisée.
if (profileFlagAt >= 0) {
  if (profileArg == null) {
    console.error('✗ --profile attend un nom de profile');
    process.exit(1);
  }
  const storedProfiles = readStackProfiles(ENV_LOCAL);
  const entry = storedProfiles[profileArg];
  if (!entry) {
    const names = Object.keys(storedProfiles);
    console.error(
      names.length
        ? `✗ profile inconnu : « ${profileArg} » — profiles enregistrés : ${names.map((n) => `« ${n} »`).join(', ')}`
        : '✗ aucun profile enregistré — sauvegardez-en un avec x dans make tui'
    );
    process.exit(1);
  }
  // Le filtre KNOWN écarte les profils disparus du registre depuis la
  // sauvegarde ; withRequirements re-complétera les dépendances plus bas.
  selection = entry.profiles
    .split(',')
    .map((s) => s.trim())
    .filter((v) => KNOWN.has(v));
  if (!selection.length) {
    console.error(
      `✗ profile « ${profileArg} » obsolète — aucun de ses composants n'existe encore dans le registre`
    );
    process.exit(1);
  }
} else if (!process.stderr.isTTY) {
  selection = saved;
} else {
  const { picked } = await prompts(
    {
      type: 'multiselect',
      name: 'picked',
      message: 'Composants à lancer (espace pour cocher, entrée pour valider)',
      instructions: false,
      choices: COMPONENTS.map((c) => ({
        title: c.title,
        value: c.value,
        selected: saved.includes(c.value),
      })),
      stdout: process.stderr,
    },
    { onCancel: () => process.exit(1) }
  );
  selection = picked;
}

if (!selection?.length) {
  console.error('✗ aucune sélection — rien à lancer');
  process.exit(1);
}

const profiles = withRequirements(selection);
save(profiles);
process.stdout.write(profiles.join(','));
