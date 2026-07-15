// Sélecteur interactif des composants de la stack locale pour `make up`.
// Affiche une liste à cocher (services + apps, un profil docker compose par
// composant), complète automatiquement les dépendances entre profils, persiste
// la sélection dans .env.local (COMPOSE_PROFILES, convention native compose)
// et écrit la valeur sur stdout pour que le Makefile la capture ; l'UI passe
// par stderr. Sans TTY, ressort la dernière sélection sans prompt.
import prompts from 'prompts';
import { INFRA_COMPONENTS, REQUIRES } from './dev-apps.mjs';
import { readEnvValue, writeEnvValue } from './env-local.mjs';

const ENV_LOCAL = '.env.local';

const COMPONENTS = [
  ...INFRA_COMPONENTS,
  {
    value: 'apps',
    title:
      'Apps — conteneur unique pnpm dev (app:3000, auth:3003, site:3001, panier:3002, backend:8080)',
  },
];

const DEFAULT_SELECTION = COMPONENTS.map((c) => c.value);

const readSaved = () =>
  readEnvValue(ENV_LOCAL, 'COMPOSE_PROFILES')
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? null;

const save = (profiles) =>
  writeEnvValue(ENV_LOCAL, 'COMPOSE_PROFILES', profiles.join(','));

const withRequirements = (selection) => {
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

let selection;
if (!process.stderr.isTTY) {
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
