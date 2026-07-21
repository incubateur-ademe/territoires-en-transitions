// Flux `prompts` des profiles de stack, exécutés TUI démonté (le terminal
// est rendu à un flux interactif) : sauvegarde (x) et sélection (p).
// Même lib que pick-stack.mts — mais ici rien ne capture stdout, l'UI
// s'affiche normalement.
import prompts from 'prompts';
import { APPS } from './dev-apps.mts';
import { readEnvValue } from './env-local.mts';
import {
  readStackProfiles,
  validateProfileName,
  writeStackProfiles,
} from './stack-profiles.mts';

const NEW_PROFILE = Symbol('nouveau profile');

// Sauvegarde la stack courante (services running hors one-shots) sous un nom
// — nouveau ou existant (écrasé). Retourne le nom, ou null si annulé (Échap).
export async function saveProfileFlow(
  runningServices: string[]
): Promise<string | null> {
  const stored = readStackProfiles();
  const { choice } = await prompts({
    type: 'select',
    name: 'choice',
    message: 'Sauvegarder la stack courante sous…',
    choices: [
      { title: '+ Nouveau profile…', value: NEW_PROFILE },
      ...Object.keys(stored).map((name) => ({
        title: name,
        value: name,
        description: 'écraser',
      })),
    ],
  });
  if (choice === undefined) return null;
  let name = choice as string;
  if (choice === NEW_PROFILE) {
    const { entered } = await prompts({
      type: 'text',
      name: 'entered',
      message: 'Nom du profile',
      validate: (value: string) => validateProfileName(value) ?? true,
    });
    if (entered === undefined) return null;
    name = (entered as string).trim();
  }
  // Profils compose à réappliquer, alignés sur l'état running réel (donc sur
  // `services`, sinon les deux voies de rechargement — touche p vs make up p=
  // — divergeraient) : l'infra (1 profil → N services) est reprise de
  // COMPOSE_PROFILES telle quelle ; les apps (1:1 service↔profil) sont
  // dérivées des services running, pas du CSV — une app démarrée via le
  // toggle hors COMPOSE_PROFILES compte donc quand même.
  const appProfiles = new Set(Object.keys(APPS));
  const infra = ((readEnvValue('.env.local', 'COMPOSE_PROFILES') ?? '') as string)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !appProfiles.has(p));
  const runningApps = runningServices.filter((s) => appProfiles.has(s));
  stored[name] = {
    profiles: [...infra, ...runningApps].join(','),
    services: [...runningServices].sort(),
  };
  writeStackProfiles(stored);
  return name;
}

// Choix d'un profile enregistré ; retourne son nom, ou null si annulé.
export async function pickProfileFlow(): Promise<string | null> {
  const stored = readStackProfiles();
  const names = Object.keys(stored);
  if (!names.length) return null;
  const { name } = await prompts({
    type: 'select',
    name: 'name',
    message: 'Charger le profile…',
    choices: names.map((n) => ({
      title: n,
      value: n,
      description: stored[n].profiles,
    })),
  });
  return (name as string | undefined) ?? null;
}

// Pause « entrée pour continuer » : laisser lire la sortie d'une commande en
// échec avant que l'alternate screen du TUI ne la masque au remontage.
export async function pauseForEnter(message: string): Promise<void> {
  await prompts({ type: 'invisible', name: 'ok', message });
}
