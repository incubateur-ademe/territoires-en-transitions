export type StatutFiche = 'En cours' | 'En retard' | 'Réalisé';
export type PrioriteFiche =
  | 'Priorité élevée'
  | 'Priorité moyenne'
  | 'Priorité basse';

export type Fiche = Readonly<{
  id: number;
  statut: StatutFiche;
  priorite: PrioriteFiche;
  plan: string;
  titre: string;
  sousActions: Readonly<{ realisees: number; total: number }>;
  pilote: string;
  echeance: string;
  enRetard: boolean;
  budgetPrevisionnel: number;
  indicateursLies: number;
  etiquettes: ReadonlyArray<string>;
  estPrivee: boolean;
  modifieeLe: string;
}>;

export const fiches: ReadonlyArray<Fiche> = [
  {
    id: 1,
    statut: 'En cours',
    priorite: 'Priorité élevée',
    plan: 'Plan climat-air-énergie · Axe 2 Mobilité durable',
    titre:
      'Déployer un réseau de pistes cyclables sécurisées entre les communes du territoire',
    sousActions: { realisees: 3, total: 5 },
    pilote: 'Camille Martin',
    echeance: '30 juin 2027',
    enRetard: false,
    budgetPrevisionnel: 450_000,
    indicateursLies: 2,
    etiquettes: ['Mobilité', 'Vélo'],
    estPrivee: false,
    modifieeLe: '21 oct.',
  },
  {
    id: 2,
    statut: 'En retard',
    priorite: 'Priorité moyenne',
    plan: 'Plan climat-air-énergie · Axe 4 Bâtiments et équipements',
    titre:
      'Rénover l’éclairage public en LED sur l’ensemble des voiries communales',
    sousActions: { realisees: 1, total: 4 },
    pilote: 'Services techniques',
    echeance: '15 sept. 2026',
    enRetard: true,
    budgetPrevisionnel: 120_000,
    indicateursLies: 1,
    etiquettes: ['Énergie'],
    estPrivee: true,
    modifieeLe: '2 sept.',
  },
  {
    id: 3,
    statut: 'Réalisé',
    priorite: 'Priorité basse',
    plan: 'Plan déchets · Axe 1 Prévention et réemploi',
    titre:
      'Mettre en place une plateforme de compostage partagé dans les quartiers',
    sousActions: { realisees: 6, total: 6 },
    pilote: 'Léa Bernard',
    echeance: '31 mars 2026',
    enRetard: false,
    budgetPrevisionnel: 35_000,
    indicateursLies: 3,
    etiquettes: ['Déchets', 'Alimentation'],
    estPrivee: false,
    modifieeLe: '4 avr.',
  },
];
