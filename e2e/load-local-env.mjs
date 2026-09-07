// Environnement des tests e2e joués en local, contre la stack de développement.
//
// Chargé par playwright.config.mjs — donc par TOUS les lanceurs (terminal, mode
// --ui, extension Playwright de l'IDE) et pas seulement par une ligne de
// commande enveloppée de `dotenvx run`. Sans ça, l'extension lance Playwright
// nu : les specs voient `SUPABASE_DATABASE_URL` vide et échouent sur un
// « Error adding collectivite on database undefined ».
//
// En CI, rien n'est lu ici : le workflow injecte les variables lui-même
// (cf. .github/workflows/test-end-to-end.yml) et .env.keys n'y existe pas.
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenvx from '@dotenvx/dotenvx';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fromRepoRoot = (path) => resolve(repoRoot, path);

// Même ordre que `env_flags` dans le Makefile : le premier fichier qui définit
// une variable gagne, et une variable déjà présente dans l'environnement gagne
// sur tous — la recette `dotenvx run … -- playwright test` reste prioritaire.
const ENV_FILES = [
  'apps/backend/.env.local',
  'apps/backend/.env',
  '.env.local',
  '.env',
];

// Les secrets que les specs lisent directement (cf. e2e/tests/shared/).
const SECRETS = [
  'SUPABASE_DATABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
];

const readEnvFiles = () => {
  const parsed = {};
  dotenvx.config({
    path: ENV_FILES.map(fromRepoRoot).filter(existsSync),
    envKeysFile: fromRepoRoot('.env.keys'),
    // Cible isolée : seules les variables listées plus bas passent ensuite dans
    // process.env, le reste de la config backend ne pollue pas le runner.
    processEnv: parsed,
    quiet: true,
  });
  return parsed;
};

const missingSecret = (key) =>
  new Error(
    [
      `[e2e] ${key} introuvable.`,
      existsSync(fromRepoRoot('.env.keys'))
        ? `  Attendu dans un des fichiers : ${ENV_FILES.join(', ')}`
        : '  Le fichier .env.keys manque à la racine : récupérez son contenu dans Vaultwarden puis lancez `make env-keys`.',
    ].join('\n')
  );

export const loadLocalEnv = () => {
  if (process.env.CI) return;

  const fromFiles = readEnvFiles();

  for (const key of SECRETS) {
    const value = process.env[key] || fromFiles[key];
    if (!value) throw missingSecret(key);
    process.env[key] = value;
  }

  // `SUPABASE_API_URL` n'existe sous ce nom dans aucun .env : c'est le Kong
  // local, que le backend connaît sous `SUPABASE_URL`.
  process.env.SUPABASE_API_URL ||=
    fromFiles.SUPABASE_URL || 'http://127.0.0.1:54321';
  process.env.SUPABASE_MAILPIT_URL ||= 'http://127.0.0.1:54324';

  // Ports décalés dans un worktree (.env.local, cf. scripts/worktree-env.mts).
  process.env.BASE_URL ||= `http://localhost:${fromFiles.APP_PORT || 3000}`;
  process.env.BASE_API_URL ||= `http://localhost:${
    fromFiles.BACKEND_PORT || 8080
  }`;
};
