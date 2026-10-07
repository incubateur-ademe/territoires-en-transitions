// Active ou désactive les hooks git du dépôt (make hooks / make hooks-off).
//
// L'activation écrase core.hooksPath : la valeur précédente est mémorisée dans
// tet.hooksPathBackup pour être restaurée à l'extinction. L'ABSENCE de cette
// clé vaut « il n'y avait pas de valeur » — git config distingue absent (code 1)
// de vide (code 0), un second drapeau serait redondant.
// UI sur stderr, comme les autres scripts du dossier.
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const HOOKS_DIR = '.githooks';
const HOOKS_KEY = 'core.hooksPath';
const BACKUP_KEY = 'tet.hooksPathBackup';

const git = (...args: string[]): string =>
  execFileSync('git', args, { encoding: 'utf8' }).trim();

// git config --get sort en 1 quand la clé est absente : on renvoie undefined
// pour la distinguer d'une valeur vide.
const get = (key: string): string | undefined => {
  try {
    return git('config', '--local', '--get', key);
  } catch {
    return undefined;
  }
};

const set = (key: string, value: string): string =>
  git('config', '--local', key, value);

const unset = (key: string): void => {
  if (get(key) !== undefined) git('config', '--local', '--unset-all', key);
};

const enable = (): void => {
  if (!existsSync(HOOKS_DIR)) {
    console.error(`✗ dossier ${HOOKS_DIR} absent à la racine du dépôt.`);
    process.exit(1);
  }
  const current = get(HOOKS_KEY);
  // Deuxième activation : ne pas écraser la sauvegarde par .githooks lui-même.
  if (current !== HOOKS_DIR) {
    if (current === undefined) unset(BACKUP_KEY);
    else set(BACKUP_KEY, current);
  }
  // git ignore un hook non exécutable, sans rien dire.
  for (const entry of readdirSync(HOOKS_DIR)) {
    const hook = join(HOOKS_DIR, entry);
    if (statSync(hook).isFile()) chmodSync(hook, 0o755);
  }
  set(HOOKS_KEY, HOOKS_DIR);
  console.error(`✓ hooks git activés (${HOOKS_DIR})`);
};

const disable = (): void => {
  // Ne toucher à core.hooksPath que s'il pointe bien sur nos hooks : sinon il
  // appartient à quelqu'un d'autre (husky…) et n'est pas à nous de l'effacer.
  if (get(HOOKS_KEY) === HOOKS_DIR) {
    const backup = get(BACKUP_KEY);
    if (backup === undefined) unset(HOOKS_KEY);
    else set(HOOKS_KEY, backup);
  }
  unset(BACKUP_KEY);
  console.error('✓ hooks git du dépôt désactivés');
};

const mode = process.argv[2];
if (mode === 'on') enable();
else if (mode === 'off') disable();
else {
  console.error('✗ usage : node scripts/toggle-hooks.mts on|off');
  process.exit(1);
}
