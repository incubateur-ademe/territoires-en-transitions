// Modèle métier d'un service de la stack : enrichit une ligne de
// `compose ps` (classification en section, tri, statut) — ignore
// délibérément la résolution d'URL (cf. url-resolver.mts) : les deux
// préoccupations s'ignorent l'une l'autre, injectées séparément par
// build-services.mts.
import { APPS } from '../../dev-apps.mjs';
import type { PsRow } from '../docker-stack.mts';
import { deriveStatus } from './status.mts';
import type { StatusGlyph } from './status.mts';

// Conteneurs one-shot : exited(0) est leur état nominal — affichés atténués
// et exclus des actions ((re)démarrer ré-exécuterait migrations ou seeds).
const ONE_SHOTS = new Set(['deps', 'libs', 'sqitch', 'seeder']);

// Apps secondaires : des UI d'appoint (CMS, outils d'inspection), ni apps du
// produit ni couches d'infra. Le reste des services non-app = infra.
const SECONDARY_APPS = new Set(['studio', 'strapi', 'mailpit']);

// Ordre d'affichage des apps : les deux critiques d'abord, le reste dans
// l'ordre du registre dev-apps.
const APP_ORDER = [
  'app',
  'backend',
  ...Object.keys(APPS).filter((app) => app !== 'app' && app !== 'backend'),
];

// Titres des sections de la liste, indexés par StackService.section.
export const SECTION_TITLES = [
  'Apps',
  'Infra',
  'Apps secondaires',
  'One-shots',
];

export class StackService {
  name: string;
  containerName: string; // clé de jointure avec compose stats
  state: string;
  health: string;
  exitCode: number;
  url: string | null;

  constructor(row: PsRow, url: string | null) {
    this.name = row.Service;
    this.containerName = row.Name ?? '';
    this.state = row.State ?? '';
    this.health = row.Health ?? '';
    this.exitCode = row.ExitCode ?? 0;
    this.url = url;
  }

  get isOneShot(): boolean {
    return ONE_SHOTS.has(this.name);
  }

  // Cible du toggle espace : un service qui tourne (même en redémarrage) se
  // stoppe, tout le reste se démarre.
  get isRunning(): boolean {
    return this.state === 'running' || this.state === 'restarting';
  }

  // Section d'affichage — cf. SECTION_TITLES.
  get section(): number {
    if (APP_ORDER.includes(this.name)) return 0;
    if (this.isOneShot) return 3;
    if (SECONDARY_APPS.has(this.name)) return 2;
    return 1;
  }

  get dimmed(): boolean {
    return this.isOneShot;
  }

  // Glyphe d'affichage dérivé de l'état compose (state + healthcheck).
  get status(): StatusGlyph {
    return deriveStatus(this.state, this.health, this.exitCode);
  }

  // Sections dans l'ordre de SECTION_TITLES ; les apps gardent l'ordre
  // d'APP_ORDER, le reste est alphabétique.
  static compare(a: StackService, b: StackService): number {
    return (
      a.section - b.section ||
      a.#appIndex - b.#appIndex ||
      a.name.localeCompare(b.name)
    );
  }

  get #appIndex(): number {
    const index = APP_ORDER.indexOf(this.name);
    return index === -1 ? 0 : index;
  }
}
