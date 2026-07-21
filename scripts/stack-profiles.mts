// Profiles de stack nommés : des instantanés réutilisables de la sélection
// de composants — sauvés depuis le TUI (x), rechargés par la touche p
// du TUI ou `make up p="<nom>"`. Stockés dans .env.local (gitignoré, donc
// per-checkout : tronc et worktrees ont chacun les leurs) sous
// TET_STACK_PROFILES, en JSON single-line OBLIGATOIREMENT single-quoté : la
// branche worktree du Makefile source le fichier (`set -a; . ./.env.local`)
// et le JSON contient espaces et doubles quotes.
import { readEnvValue, writeEnvValue } from './env-local.mjs';

export const STACK_PROFILES_KEY = 'TET_STACK_PROFILES';

const ENV_LOCAL = '.env.local';

// - profiles : le CSV COMPOSE_PROFILES à réappliquer ;
// - services : instantané des services running à la sauvegarde (hors
//   one-shots), base du matching d'en-tête du TUI.
export interface StackProfileEntry {
  profiles: string;
  services: string[];
}

export type StackProfiles = Record<string, StackProfileEntry>;

const isEntry = (entry: unknown): entry is StackProfileEntry => {
  const e = entry as Partial<StackProfileEntry> | null;
  return (
    typeof e?.profiles === 'string' &&
    Array.isArray(e.services) &&
    e.services.every((s) => typeof s === 'string')
  );
};

export const readStackProfiles = (file = ENV_LOCAL): StackProfiles => {
  const raw = readEnvValue(file, STACK_PROFILES_KEY);
  if (!raw) return {};
  const json =
    raw.startsWith("'") && raw.endsWith("'") ? raw.slice(1, -1) : raw;
  try {
    // Les entrées difformes (fichier édité à la main) sont écartées une à
    // une ; un JSON illisible vaut « aucun profile » — la prochaine
    // sauvegarde ré-écrit la clé proprement.
    return Object.fromEntries(
      Object.entries(JSON.parse(json) as Record<string, unknown>).filter(
        (kv): kv is [string, StackProfileEntry] => isEntry(kv[1])
      )
    );
  } catch {
    return {};
  }
};

export const writeStackProfiles = (
  profiles: StackProfiles,
  file = ENV_LOCAL
): void =>
  writeEnvValue(file, STACK_PROFILES_KEY, `'${JSON.stringify(profiles)}'`);

// null si le nom est utilisable, sinon le message d'erreur. Caractères
// interdits : `'` casserait le sourcing shell de .env.local ; `"`, `` ` `` et
// `$` sont ré-interprétés par le shell de la recette make dans
// `--profile "$(p)"` (mangling, voire exécution d'une sous-commande via
// backtick) ; le backslash échapperait le JSON. Un nom sans eux se stocke et
// se rejoue sans échappement.
export const validateProfileName = (name: string): string | null => {
  if (!name.trim()) return 'nom vide';
  if (/['"\\`$]/.test(name))
    return 'caractères interdits dans un nom : \' " \\ ` $';
  return null;
};

// Nom du profile dont le snapshot égale (ensemblistement) les services
// running — le premier déclaré gagne en cas d'ex æquo ; null sinon.
export const matchProfileName = (
  profiles: StackProfiles,
  runningServices: string[]
): string | null => {
  const running = new Set(runningServices);
  for (const [name, { services }] of Object.entries(profiles)) {
    if (
      services.length === running.size &&
      services.every((s) => running.has(s))
    )
      return name;
  }
  return null;
};
