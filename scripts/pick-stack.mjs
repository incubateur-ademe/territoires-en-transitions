// Sélecteur interactif des composants de la stack locale pour `make up`.
// Affiche une liste à cocher (services + apps, un profil docker compose par
// composant), complète automatiquement les dépendances entre profils, persiste
// la sélection dans .env.local (COMPOSE_PROFILES, convention native compose)
// et écrit la valeur sur stdout pour que le Makefile la capture ; l'UI passe
// par stderr. Sans TTY, ressort la dernière sélection sans prompt.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import prompts from 'prompts';

const ENV_LOCAL = '.env.local';

const COMPONENTS = [
  { value: 'supabase', title: 'Supabase (db, kong, gotrue, rest, realtime, storage, mailpit)' },
  { value: 'studio', title: 'Supabase Studio (localhost:54323)' },
  { value: 'redis', title: 'Redis (localhost:6379)' },
  { value: 'strapi', title: 'Strapi + sa base Postgres (localhost:1337)' },
  {
    value: 'apps',
    title:
      'Apps — conteneur unique pnpm dev (app:3000, auth:3003, site:3001, panier:3002, backend:8080)',
  },
];

// docker compose refuse un depends_on vers un service dont le profil est
// inactif : on complète la sélection avec les profils requis.
const REQUIRES = {
  apps: ['supabase', 'redis'],
  studio: ['supabase'],
};

const DEFAULT_SELECTION = COMPONENTS.map((c) => c.value);

const readSaved = () => {
  if (!existsSync(ENV_LOCAL)) return null;
  const line = readFileSync(ENV_LOCAL, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('COMPOSE_PROFILES='));
  if (!line) return null;
  return line
    .slice('COMPOSE_PROFILES='.length)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const save = (profiles) => {
  const line = `COMPOSE_PROFILES=${profiles.join(',')}`;
  const lines = existsSync(ENV_LOCAL)
    ? readFileSync(ENV_LOCAL, 'utf8').split('\n')
    : [];
  const i = lines.findIndex((l) => l.startsWith('COMPOSE_PROFILES='));
  if (i >= 0) lines[i] = line;
  else {
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    lines.push(line, '');
  }
  writeFileSync(ENV_LOCAL, lines.join('\n'));
};

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
