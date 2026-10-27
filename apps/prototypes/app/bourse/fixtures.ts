import type { BadgeProps } from '@tet/ui';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

export const fiche = {
  numero: '2.3',
  titre: 'Rénover les bâtiments communaux les plus énergivores',
  modifieeLe: '21 octobre 2026',
  modifieePar: 'Claire Martin',
} as const;

export const fildAriane: ReadonlyArray<
  Readonly<{ label: string; href?: string }>
> = [
  { label: 'Plans', href: '#plans' },
  { label: 'Plan Climat Air Énergie 2024-2030', href: '#pcaet' },
  { label: 'Axe 2 · Patrimoine et bâtiments', href: '#axe-2' },
  { label: 'Fiche 2.3' },
];

export const sections = [
  { id: 'suivi', label: 'Suivi' },
  { id: 'indicateurs', label: 'Indicateurs' },
  { id: 'etapes', label: 'Étapes' },
  { id: 'budget', label: 'Budget' },
  { id: 'documents', label: 'Documents' },
  { id: 'historique', label: 'Historique' },
] as const;

export type SectionId = (typeof sections)[number]['id'];

export const description = {
  texte:
    "Le patrimoine communal compte 42 bâtiments, qui représentent 61 % de la consommation énergétique de la collectivité. Cette fiche vise à rénover en priorité les 12 bâtiments les plus énergivores (étiquettes E à G) pour respecter le décret tertiaire et réduire de 40 % la consommation d'ici 2030.",
  objectifs: [
    "Réduire de 40 % la consommation énergétique du patrimoine bâti d'ici 2030 (référence 2019)",
    "Rénover 12 bâtiments classés E à G d'ici fin 2028",
    'Raccorder la mairie et la médiathèque au réseau de chaleur biomasse',
  ],
  etiquettes: [
    { titre: 'Bâtiments', creee: false },
    { titre: 'Énergie', creee: false },
    { titre: 'Décret tertiaire', creee: false },
    { titre: 'Sobriété', creee: true },
  ],
} as const;

export const consommations: ReadonlyArray<
  Readonly<{ annee: number; mwh: number }>
> = [
  { annee: 2019, mwh: 8450 },
  { annee: 2020, mwh: 8210 },
  { annee: 2021, mwh: 7980 },
  { annee: 2022, mwh: 7640 },
  { annee: 2023, mwh: 7310 },
  { annee: 2024, mwh: 7120 },
  { annee: 2025, mwh: 6920 },
];

export const objectifConsommation = { annee: 2030, mwh: 5070 } as const;

export type IndicateurLie = Readonly<{
  nom: string;
  reference: string;
  actuel: string;
  objectif: string;
  tendance: string;
  variante: BadgeVariant;
}>;

export const indicateursLies: ReadonlyArray<IndicateurLie> = [
  {
    nom: 'Consommation énergétique du patrimoine (MWh)',
    reference: '8 450',
    actuel: '6 920',
    objectif: '5 070',
    tendance: 'En retard',
    variante: 'warning',
  },
  {
    nom: 'Émissions de GES du patrimoine (tCO₂e)',
    reference: '1 820',
    actuel: '1 410',
    objectif: '910',
    tendance: 'Dans la trajectoire',
    variante: 'success',
  },
  {
    nom: 'Part des bâtiments classés E à G (%)',
    reference: '29 %',
    actuel: '21 %',
    objectif: '0 %',
    tendance: 'Dans la trajectoire',
    variante: 'success',
  },
  {
    nom: 'Part de chaleur renouvelable (%)',
    reference: '12 %',
    actuel: '24 %',
    objectif: '50 %',
    tendance: 'À compléter',
    variante: 'grey',
  },
];

export type Etape = Readonly<{
  numero: number;
  titre: string;
  detail: string;
  statut: string;
  variante: BadgeVariant;
}>;

export const etapes: ReadonlyArray<Etape> = [
  {
    numero: 1,
    titre: 'Audit énergétique des 42 bâtiments',
    detail: 'Terminé le 30 juin 2024 · Service patrimoine',
    statut: 'Réalisé',
    variante: 'success',
  },
  {
    numero: 2,
    titre: 'Plan pluriannuel de rénovation voté en conseil',
    detail: 'Terminé le 12 nov. 2024 · Jean Dupont',
    statut: 'Réalisé',
    variante: 'success',
  },
  {
    numero: 3,
    titre: 'Rénovation du groupe scolaire Jean Moulin',
    detail: 'Échéance 15 déc. 2026 · Claire Martin',
    statut: 'En cours',
    variante: 'info',
  },
  {
    numero: 4,
    titre: 'Isolation et ventilation du gymnase municipal',
    detail: 'Échéance repoussée au 30 juin 2027 · Thomas Leroy',
    statut: 'En retard',
    variante: 'warning',
  },
  {
    numero: 5,
    titre: 'Raccordement de la mairie au réseau de chaleur',
    detail: 'Échéance 31 mars 2028 · Thomas Leroy',
    statut: 'À venir',
    variante: 'standard',
  },
];

export const pilotage: ReadonlyArray<
  Readonly<{ terme: string; valeur: string }>
> = [
  { terme: 'Pilotes', valeur: 'Claire Martin, Thomas Leroy' },
  {
    terme: 'Élu référent',
    valeur: 'Jean Dupont, adjoint à la transition écologique',
  },
  {
    terme: 'Direction ou service pilote',
    valeur: 'Service patrimoine et bâtiments',
  },
  {
    terme: 'Partenaires',
    valeur:
      "ADEME, Syndicat départemental d'énergie, Agence locale de l'énergie",
  },
];

export const calendrier = {
  debut: '1er mars 2024',
  fin: 'Fin prévue : 31 déc. 2028',
  tempsEcoule: 0.54,
  avancement: 0.62,
} as const;

export const financements: ReadonlyArray<
  Readonly<{ libelle: string; montant: string }>
> = [
  { libelle: 'Fonds vert', montant: '640 000 €' },
  { libelle: 'ADEME – Fonds chaleur', montant: '210 000 €' },
  { libelle: 'DSIL', montant: '180 000 €' },
  { libelle: 'Autofinancement', montant: '1 070 000 €' },
];

export const budgetPrevisionnel = '2 100 000 €';

export const referentiels: ReadonlyArray<string> = [
  'CAE 2.2.1 – Réaliser un diagnostic du patrimoine',
  'CAE 2.2.2 – Réduire les consommations du patrimoine',
];

export const activites: ReadonlyArray<
  Readonly<{ texte: string; date: string }>
> = [
  {
    texte: "Claire Martin a mis à jour le statut de l'étape 3",
    date: '21 oct. 2026',
  },
  {
    texte: "Thomas Leroy a repoussé l'échéance de l'étape 4",
    date: '14 oct. 2026',
  },
  {
    texte:
      'Résultat 2025 saisi pour « Consommation énergétique du patrimoine »',
    date: '2 oct. 2026',
  },
];
