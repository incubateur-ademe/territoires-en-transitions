import { createTimeline } from '@/site/components/animated-demo/timeline';
import type { DemarchePcaetVulnerabiliteNiveau } from '@tet/domain/demarches';

/**
 * Scénario de la démo du dépôt PCAET, en temps de scène (secondes). Chaque
 * écran se termine par une pause de lecture, le temps de le lire.
 */
export const DEPOT_TIMELINE = createTimeline({
  duration: 37.5,
  holds: [4.95, 17.4, 21.7, 26.1],
  holdDuration: 1.5,
});

/** Écran figé quand les animations sont réduites : avis reçus, prêt à adopter. */
export const FROZEN_SCENE_TIME = 26.7;

export const SCREENS = [
  { screen: 'documents', start: 0, chapter: '1. Documents' },
  { screen: 'diagnostic', start: 6.4, chapter: '2. Diagnostic' },
  { screen: 'programme', start: 18.5, chapter: "3. Programme d'actions" },
  { screen: 'avis', start: 22.8, chapter: '4. Avis et adoption' },
] as const;

export type DepotScreen = (typeof SCREENS)[number]['screen'];

export const DOCUMENTS: {
  name: string;
  required: boolean;
  description?: string;
  /** Sans dépôt, la pièce est déclarée incluse dans le « PCAET global ». */
  upload?: { at: number; file: string };
}[] = [
  {
    name: 'PCAET global',
    required: false,
    description:
      'Document unique regroupant une partie des pièces obligatoires attendues.',
    upload: { at: 0.8, file: 'PCAET Global.pdf' },
  },
  {
    name: "Délibération d'engagement / déclaration d'intention",
    required: false,
    upload: { at: 2.4, file: 'Délibération engagement.pdf' },
  },
  { name: 'Diagnostic', required: true },
  { name: 'Stratégie territoriale', required: true },
  { name: "Programme d'actions", required: true },
  { name: "Dispositif de suivi et d'évaluation", required: true },
  { name: 'EES (évaluation environnementale stratégique)', required: true },
  {
    name: 'Bilan du PCAET précédent',
    required: true,
    upload: { at: 3.4, file: 'Bilan PCAET précédent.pdf' },
  },
  { name: "Délibération d'arrêt du PCAET", required: true },
];

/** Les inclusions se cochent une à une, une fois le PCAET global déposé. */
export const INCLUSIONS = { start: 2.3, step: 0.12 };

export const VOLETS: {
  name: string;
  shortName: string;
  /** Les volets d'indicateurs se saisissent en valeurs, la vulnérabilité en niveaux. */
  kind: 'indicateurs' | 'vulnerabilite';
  unit?: string;
  optional: boolean;
  /** Tracé SVG (viewBox 24) de l'icône du volet. */
  iconPath: string;
  /** Instants où le volet devient le volet affiché, puis complété. */
  openAt: number;
  completedAt: number;
}[] = [
  {
    name: 'Émissions GES',
    shortName: 'GES',
    kind: 'indicateurs',
    unit: 'kteq CO2',
    optional: false,
    iconPath: 'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z',
    openAt: 0,
    completedAt: 9.2,
  },
  {
    name: 'Polluants atmosphériques',
    shortName: 'Polluants',
    kind: 'indicateurs',
    unit: 't',
    optional: false,
    iconPath:
      'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M5 5h.01M19 5h.01M5 19h.01M19 19h.01M12 4h.01M12 20h.01',
    openAt: 9.5,
    completedAt: 9.85,
  },
  {
    name: 'Séquestration carbone',
    shortName: 'Séquestration',
    kind: 'indicateurs',
    unit: 'kteq CO2',
    optional: true,
    iconPath:
      'M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 12c0-4 3-6 7-6 0 4-3 6-7 6z',
    openAt: 9.95,
    completedAt: 10.3,
  },
  {
    name: 'Consommation énergétique finale',
    shortName: 'Consommation',
    kind: 'indicateurs',
    unit: 'GWh',
    optional: false,
    iconPath: 'M13 2L4 14h7l-1 8 9-12h-7z',
    openAt: 10.4,
    completedAt: 10.75,
  },
  {
    name: 'Énergies renouvelables',
    shortName: 'EnR',
    kind: 'indicateurs',
    unit: 'GWh',
    optional: false,
    iconPath:
      'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
    openAt: 10.85,
    completedAt: 11.2,
  },
  {
    name: 'Vulnérabilité du territoire',
    shortName: 'Vulnérabilité',
    kind: 'vulnerabilite',
    optional: true,
    iconPath: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
    openAt: 11.3,
    completedAt: 17.15,
  },
];

type Niveau = DemarchePcaetVulnerabiliteNiveau;

/** Volet vulnérabilité : un niveau par thématique et par horizon, comme dans l'app. */
export const VULNERABILITE: {
  horizons: string[];
  thematiques: { name: string; niveaux: [Niveau, Niveau, Niveau] }[];
} = {
  horizons: ['Actuelle', '2050', '2100'],
  thematiques: [
    { name: 'Agriculture', niveaux: ['faible', 'moyen', 'fort'] },
    { name: 'Aménagement', niveaux: ['non_concerne', 'faible', 'faible'] },
    { name: 'Bâtiments', niveaux: ['moyen', 'moyen', 'moyen'] },
    { name: 'Biodiversité', niveaux: ['moyen', 'fort', 'fort'] },
    { name: 'Eau', niveaux: ['moyen', 'fort', 'fort'] },
    { name: 'Forêt', niveaux: ['moyen', 'fort', 'fort'] },
    { name: 'Énergie', niveaux: ['moyen', 'moyen', 'moyen'] },
    { name: 'Santé', niveaux: ['faible', 'moyen', 'fort'] },
  ],
};

/**
 * Saisie de la vulnérabilité : les premières thématiques au rythme d'un clic,
 * pour qu'on voie ce qui se fait, puis les suivantes d'un coup.
 */
const VULNERABILITE_INPUT = {
  start: 11.6,
  cellStep: 0.35,
  rowStep: 1.1,
  detailedRows: 5,
  flashStart: 16.9,
  flashStep: 0.05,
  /** Écriture de l'objectif, une fois les trois niveaux posés. */
  objectifDuration: 0.5,
};

/** Instant où le niveau d'une thématique (`row`) à un horizon (`column`) est saisi. */
export const getNiveauInputTime = (row: number, column: number) => {
  const { start, cellStep, rowStep, detailedRows, flashStart, flashStep } =
    VULNERABILITE_INPUT;
  return row < detailedRows
    ? start + row * rowStep + column * cellStep
    : flashStart + (row - detailedRows) * flashStep + column * 0.015;
};

/** Début et durée de l'écriture de l'objectif 2050 d'une thématique. */
export const getObjectifTyping = (row: number) =>
  row < VULNERABILITE_INPUT.detailedRows
    ? {
        start: getNiveauInputTime(row, 2) + 0.15,
        duration: VULNERABILITE_INPUT.objectifDuration,
      }
    : { start: getNiveauInputTime(row, 2), duration: 0.05 };

export const DIAGNOSTIC_YEARS = [2026, 2030, 2036, 2050];

export const SECTORS = [
  'Résidentiel',
  'Tertiaire',
  'Transport routier',
  'Autres transports',
  'Agriculture',
  'Déchets',
  'Industrie hors branche énergie',
  'Industrie branche énergie',
];

/** Valeurs du volet GES, par secteur et par année. */
export const GES_VALUES = [
  [650, 410, 12, 3],
  [120, 100, 80, 60],
  [120, 100, 50, 35],
  [15, 12, 14, 15],
  [1330, 1200, 950, 600],
  [700, 500, 200, 100],
  [300, 200, 100, 80],
  [150, 120, 75, 56],
];

export const PROGRAMME_IMPORT = {
  file: "Programme d'actions.pdf",
  flyAt: 19.3,
  loadingAt: 19.8,
  doneAt: 20.8,
  actionCount: 62,
  verifiedAt: 21.4,
  validatedAt: 21.5,
};

export const ELABORATION_SUB_STEPS: {
  title: string;
  shortTitle: string;
  description: string;
  completedAt: number;
  screen: DepotScreen;
}[] = [
  {
    title: 'Ajouter les documents attendus',
    shortTitle: 'Documents',
    description: 'Déposez les pièces usuelles du dossier.',
    completedAt: 4.9,
    screen: 'documents',
  },
  {
    title: 'Compléter le diagnostic et les objectifs',
    shortTitle: 'Diagnostic',
    description: 'Renseignez les indicateurs par volet.',
    completedAt: 17.3,
    screen: 'diagnostic',
  },
  {
    title: "Renseigner le programme d'actions",
    shortTitle: 'Programme',
    description: "Rattachez, créez ou importez un plan d'actions.",
    completedAt: 21.5,
    screen: 'programme',
  },
];

export const ADOPTION_TIME = 27.5;

export const ETAPES: {
  title: string;
  description: string;
  start: number;
  end: number;
}[] = [
  {
    title: 'Élaboration',
    description:
      "Dépôt du diagnostic, des objectifs, du programme d'actions et des pièces jointes.",
    start: 0,
    end: 22.8,
  },
  {
    title: 'Transmis pour avis',
    description:
      'Consultations auprès du conseil régional et du préfet de région.',
    start: 22.8,
    end: 26.0,
  },
  {
    title: 'Consultation des avis et délibération',
    description:
      'Consultez les avis rendus, puis délibérez pour adopter le plan.',
    start: 26.0,
    end: ADOPTION_TIME,
  },
  {
    title: 'Adoption',
    description: 'PCAET adopté, publié et mis en œuvre.',
    start: ADOPTION_TIME,
    end: ADOPTION_TIME,
  },
];

export const AVIS = [
  {
    emitter: 'la DREAL',
    report: 'Rapport DREAL',
    file: 'Rapport DREAL.pdf',
    origin: 'Préfet de région – avis rendu',
    outAt: 24.4,
    receivedAt: 25.0,
  },
  {
    emitter: 'la Région',
    report: 'Rapport Région',
    file: 'Rapport Région.pdf',
    origin: 'Conseil régional – avis rendu',
    outAt: 25.3,
    receivedAt: 25.9,
  },
];

export const MAIL = { arrivesAt: 23.4, opensAt: 24.1 };

export const ADOPT_BUTTON = { appearsAt: 26.3 };

export const CONFETTI = { start: ADOPTION_TIME, end: 31.0 };

/** Instants des clics simulés (bouton enfoncé pendant `CLICK_DURATION`). */
export const CLICKS = [6.0, 18.1, 22.5, 27.3];
export const CLICK_DURATION = 0.25;

export type CursorKeyframe = {
  at: number;
  x: number;
  y: number;
  visible: boolean;
  /** Durée du déplacement vers ce jalon, en ms (650 par défaut). */
  transition?: number;
};

const keyframes = (
  points: [number, number, number, boolean][]
): CursorKeyframe[] =>
  points.map(([at, x, y, visible]) => ({ at, x, y, visible }));

/**
 * Le curseur va cliquer chaque niveau des thématiques saisies au ralenti.
 * `columns` : abscisse de chaque horizon (`null` s'il n'est pas affiché).
 */
const vulnerabiliteKeyframes = ({
  columns,
  firstRowY,
  rowHeight,
}: {
  columns: (number | null)[];
  firstRowY: number;
  rowHeight: number;
}): CursorKeyframe[] =>
  Array.from({ length: VULNERABILITE_INPUT.detailedRows }, (_, row) =>
    columns.flatMap((x, column) =>
      x === null
        ? []
        : [
            {
              at: getNiveauInputTime(row, column) - 0.2,
              x,
              y: firstRowY + row * rowHeight,
              visible: true,
              transition: 250,
            },
          ]
    )
  ).flat();

const sortByTime = (list: CursorKeyframe[]) =>
  [...list].sort((a, b) => a.at - b.at);

/** Trajet du curseur, en coordonnées de chaque scène. */
export const CURSOR = {
  wide: sortByTime([
    ...keyframes([
      [0, 640, 430, false],
      [5.0, 745, 682, true],
      [6.6, 560, 420, true],
      [17.5, 745, 682, true],
      [18.7, 600, 330, true],
      [21.9, 745, 682, true],
      [23.0, 560, 450, true],
      [26.6, 745, 682, true],
      [27.8, 700, 560, true],
      [30.7, 700, 560, false],
    ]),
    ...vulnerabiliteKeyframes({
      columns: [237, 383, 520],
      firstRowY: 323,
      rowHeight: 35,
    }),
  ]),
  compact: sortByTime([
    ...keyframes([
      [0, 250, 330, false],
      [5.0, 230, 527, true],
      [6.6, 250, 300, true],
      [17.5, 230, 527, true],
      [18.7, 250, 250, true],
      [21.9, 230, 527, true],
      [23.0, 250, 330, true],
      [26.6, 230, 527, true],
      [27.8, 250, 420, true],
      [30.7, 250, 420, false],
    ]),
    ...vulnerabiliteKeyframes({
      columns: [200, null, 285],
      firstRowY: 338,
      rowHeight: 25,
    }),
  ]),
};
