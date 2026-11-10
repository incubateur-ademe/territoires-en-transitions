import { createTimeline } from '@/site/components/animated-demo/timeline';
import type { DemarchePcaetVulnerabiliteNiveau } from '@tet/domain/demarches';

/**
 * Scénario de la démo du dépôt PCAET, en temps de scène (secondes). Chaque
 * écran se termine par une pause de lecture, le temps de le lire.
 *
 * Les instants sont écrits relativement au début de leur écran : l'ordre des
 * écrans suit celui du parcours de l'app, et il a déjà changé une fois.
 */
export const DIAGNOSTIC_START = 0;
export const DOCUMENTS_START = 12.1;
export const PROGRAMME_START = 18.5;
export const AVIS_START = 22.8;

export const DEPOT_TIMELINE = createTimeline({
  duration: 38.3,
  holds: [11.0, 17.15, 21.7, 26.1],
  holdDuration: 1.5,
});

/** Écran figé quand les animations sont réduites : délibération déposée, prêt à valider. */
export const FROZEN_SCENE_TIME = 28.0;

export const SCREENS = [
  { screen: 'diagnostic', start: DIAGNOSTIC_START, chapter: '1. Diagnostic' },
  { screen: 'documents', start: DOCUMENTS_START, chapter: '2. Documents' },
  {
    screen: 'programme',
    start: PROGRAMME_START,
    chapter: "3. Programme d'actions",
  },
  { screen: 'avis', start: AVIS_START, chapter: '4. Avis et adoption' },
] as const;

export type DepotScreen = (typeof SCREENS)[number]['screen'];

export type DemoDocument = {
  name: string;
  required: boolean;
  description?: string;
  /** Dépôt d'un fichier propre, à cet instant. */
  upload?: { at: number; file: string };
  /**
   * Pièce déclarée comprise dans d'autres pièces du dossier : la case se coche
   * à cet instant, et n'apparaît qu'une fois `inclusionIn[0]` déposé.
   */
  inclusion?: { at: number; in: string[] };
};

/**
 * Les pièces attendues d'un premier PCAET d'un EPCI à fiscalité propre dont une
 * commune dépasse 45 000 habitants, dans l'ordre du catalogue. Les pièces d'un
 * renouvellement (bilans) et celles des plus de 100 000 habitants (plan qualité
 * de l'air) n'y sont pas.
 */
export const DOCUMENTS: DemoDocument[] = [
  {
    name: "Délibération d'engagement / déclaration d'intention",
    required: false,
  },
  {
    name: 'Diagnostic',
    required: true,
    upload: { at: DOCUMENTS_START + 0.6, file: 'Diagnostic.pdf' },
  },
  {
    name: 'Stratégie territoriale',
    required: true,
    upload: { at: DOCUMENTS_START + 1.2, file: 'Stratégie territoriale.pdf' },
  },
  {
    name: "Programme d'actions",
    required: true,
    upload: { at: DOCUMENTS_START + 1.8, file: "Programme d'actions.pdf" },
  },
  {
    name: 'Plan local de chaleur et de froid',
    required: true,
    description:
      'Attendu des EPCI à fiscalité propre dont au moins une commune membre dépasse 45 000 habitants.',
    inclusion: {
      at: DOCUMENTS_START + 3.6,
      in: ['Diagnostic', 'Stratégie territoriale', "Programme d'actions"],
    },
  },
  {
    name: "Dispositif de suivi et d'évaluation",
    required: true,
    upload: { at: DOCUMENTS_START + 2.4, file: 'Dispositif de suivi.pdf' },
  },
  {
    name: 'EES (évaluation environnementale stratégique - dont résumé non technique)',
    required: true,
    upload: { at: DOCUMENTS_START + 3.0, file: 'EES.pdf' },
  },
  {
    name: "Délibération d'arrêt du PCAET",
    required: true,
    upload: { at: DOCUMENTS_START + 3.6, file: "Délibération d'arrêt.pdf" },
  },
];

/** Pièces déposées par la démo compacte sous forme de cartes ; les autres sont résumées. */
export const COMPACT_DOCUMENT_CARDS = [
  'Diagnostic',
  'Stratégie territoriale',
  "Programme d'actions",
];

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

export type DemoVolet = {
  name: string;
  shortName: string;
  /** Les volets d'indicateurs se saisissent en valeurs, la vulnérabilité en niveaux. */
  kind: 'indicateurs' | 'vulnerabilite';
  /** Ce que l'app dit du volet, sous les onglets. */
  description: string;
  unit?: string;
  /** Titre de la table affichée, quand le volet en compte plusieurs dans l'app. */
  tableTitle?: string;
  rows: string[];
  /** Tracé SVG (viewBox 24) de l'icône du volet. */
  iconPath: string;
  /** Instants où le volet devient le volet affiché, puis complété. */
  openAt: number;
  completedAt: number;
};

export const VOLETS: DemoVolet[] = [
  {
    name: 'Émissions GES',
    shortName: 'GES',
    kind: 'indicateurs',
    description:
      'Renseigner les émissions de gaz à effet de serre de votre territoire, issues de votre diagnostic, et vos objectifs de réduction aux différents horizons, issus de votre stratégie.',
    unit: 'kteq CO2',
    rows: SECTORS,
    iconPath: 'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z',
    openAt: DIAGNOSTIC_START,
    completedAt: DIAGNOSTIC_START + 2.8,
  },
  {
    name: 'Polluants atmosphériques',
    shortName: 'Polluants',
    kind: 'indicateurs',
    description:
      'Renseigner les émissions de polluants atmosphériques de votre territoire, issues de votre diagnostic, et vos objectifs de réduction aux différents horizons, issus de votre stratégie.',
    unit: 't',
    tableTitle: 'NOx',
    rows: SECTORS,
    iconPath:
      'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M5 5h.01M19 5h.01M5 19h.01M19 19h.01M12 4h.01M12 20h.01',
    openAt: DIAGNOSTIC_START + 3.1,
    completedAt: DIAGNOSTIC_START + 3.45,
  },
  {
    name: 'Séquestration carbone',
    shortName: 'Séquestration',
    kind: 'indicateurs',
    description:
      'Renseigner la séquestration nette de dioxyde de carbone de votre territoire, issue de votre diagnostic, et vos objectifs de stockage carbone, issus de votre stratégie.',
    unit: 'kteq CO2',
    rows: [
      'Forêt',
      'Sols agricoles (terres cultivées et prairies)',
      'Produits bois',
      'Autres sols',
    ],
    iconPath:
      'M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 12c0-4 3-6 7-6 0 4-3 6-7 6z',
    openAt: DIAGNOSTIC_START + 3.55,
    completedAt: DIAGNOSTIC_START + 3.9,
  },
  {
    name: 'Consommation énergétique finale',
    shortName: 'Consommation',
    kind: 'indicateurs',
    description:
      'Renseigner la consommation énergétique finale de votre territoire et vos objectifs de réduction de consommation d’énergie finale aux différents horizons.',
    unit: 'GWh',
    rows: SECTORS,
    iconPath: 'M13 2L4 14h7l-1 8 9-12h-7z',
    openAt: DIAGNOSTIC_START + 4.0,
    completedAt: DIAGNOSTIC_START + 4.35,
  },
  {
    name: 'Énergies renouvelables',
    shortName: 'EnR',
    kind: 'indicateurs',
    description:
      'Renseigner l’état de la production d’énergies renouvelables de votre territoire et vos objectifs de production et de consommation des énergies renouvelables.',
    unit: 'GWh',
    tableTitle: 'Électricité',
    rows: [
      'Éolien terrestre',
      'Solaire photovoltaïque',
      'Hydraulique',
      'Biomasse solide',
      'Biogaz',
    ],
    iconPath:
      'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
    openAt: DIAGNOSTIC_START + 4.45,
    completedAt: DIAGNOSTIC_START + 4.8,
  },
  {
    name: 'Vulnérabilité du territoire',
    shortName: 'Vulnérabilité',
    kind: 'vulnerabilite',
    description:
      'Évaluez le niveau de vulnérabilité du territoire pour chaque thématique, aux horizons actuel, 2050 et 2100, puis décrivez les objectifs associés.',
    rows: [],
    iconPath: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
    openAt: DIAGNOSTIC_START + 4.9,
    completedAt: DIAGNOSTIC_START + 10.85,
  },
];

/** Le premier volet se saisit ligne par ligne, les suivants d'un coup. */
export const GES_INPUT = { start: DIAGNOSTIC_START + 0.6, rowStep: 0.22 };

type Niveau = DemarchePcaetVulnerabiliteNiveau;

/**
 * Volet vulnérabilité : les thématiques du socle, un niveau par horizon, comme
 * dans l'app.
 */
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
    { name: 'Économie', niveaux: ['faible', 'moyen', 'moyen'] },
    { name: 'Santé', niveaux: ['faible', 'moyen', 'fort'] },
    { name: 'Transport', niveaux: ['faible', 'faible', 'non_concerne'] },
  ],
};

/**
 * Saisie de la vulnérabilité : les premières thématiques au rythme d'un clic,
 * pour qu'on voie ce qui se fait, puis les suivantes d'un coup.
 */
const VULNERABILITE_INPUT = {
  start: DIAGNOSTIC_START + 5.2,
  cellStep: 0.35,
  rowStep: 1.0,
  detailedRows: 4,
  flashStart: DIAGNOSTIC_START + 10.5,
  flashStep: 0.05,
  /** Écriture d'un objectif, une fois les trois niveaux posés. */
  objectifDuration: 0.45,
};

/** Instant où le niveau d'une thématique (`row`) à un horizon (`column`) est saisi. */
export const getNiveauInputTime = (row: number, column: number) => {
  const { start, cellStep, rowStep, detailedRows, flashStart, flashStep } =
    VULNERABILITE_INPUT;
  return row < detailedRows
    ? start + row * rowStep + column * cellStep
    : flashStart + (row - detailedRows) * flashStep + column * 0.015;
};

/** Horizons qui portent un objectif, dans l'ordre des colonnes. */
export const OBJECTIF_HORIZONS = ['2050', '2100'] as const;

/** Début et durée de l'écriture de l'objectif d'une thématique à un horizon. */
export const getObjectifTyping = (row: number, horizon: number) => {
  const { detailedRows, objectifDuration } = VULNERABILITE_INPUT;
  if (row >= detailedRows) {
    return { start: getNiveauInputTime(row, 2) + horizon * 0.02, duration: 0.05 };
  }
  const start = getNiveauInputTime(row, 2) + 0.15;
  return {
    start: start + horizon * (objectifDuration + 0.05),
    duration: objectifDuration,
  };
};

export const DIAGNOSTIC_YEARS = [2026, 2030, 2036, 2050];

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

/** Type de plan attendu par la démarche, tel que l'app le nomme. */
export const PCAET_PLAN_TYPE_LABEL = 'Plan Climat Air Énergie Territorial';

/**
 * Import du programme d'actions en plan : le PDF déposé à l'étape des documents
 * arrive de lui-même dans le tableau, le plan créé porte le nom proposé par
 * l'app et s'affiche prêt, sans passer par la vérification.
 */
export const PROGRAMME_IMPORT = {
  file: "Programme d'actions.pdf",
  planName: "Plan d'actions - PCAET 2026 - Ma collectivité",
  flyAt: PROGRAMME_START + 0.8,
  loadingAt: PROGRAMME_START + 1.3,
  doneAt: PROGRAMME_START + 2.3,
  actionCount: 354,
  validatedAt: PROGRAMME_START + 2.8,
};

export const ELABORATION_SUB_STEPS: {
  title: string;
  shortTitle: string;
  description: string;
  completedAt: number;
  screen: DepotScreen;
}[] = [
  {
    title: 'Compléter les données du diagnostic et de la stratégie',
    shortTitle: 'Diagnostic',
    description:
      'Renseigner les données de votre diagnostic et les objectifs de votre stratégie.',
    completedAt: DIAGNOSTIC_START + 10.9,
    screen: 'diagnostic',
  },
  {
    title: 'Ajouter les documents attendus',
    shortTitle: 'Documents',
    description: 'Déposer les documents relatifs à votre projet de PCAET.',
    completedAt: DOCUMENTS_START + 5.0,
    screen: 'documents',
  },
  {
    title: "Associer ou créer le programme d'actions détaillé",
    shortTitle: 'Programme',
    description: "Rattachez ou créez un plan d'actions dans la plateforme.",
    completedAt: PROGRAMME_IMPORT.validatedAt,
    screen: 'programme',
  },
];

export const MAIL = { arrivesAt: AVIS_START + 0.6, opensAt: AVIS_START + 1.3 };

export const AVIS = [
  {
    emitter: 'du préfet de région',
    auTitreDe: 'Préfet de région',
    report: 'Avis du préfet',
    renduLe: '4 mars 2026',
    outAt: AVIS_START + 1.6,
    receivedAt: AVIS_START + 2.2,
  },
  {
    emitter: 'du conseil régional',
    auTitreDe: 'Président du conseil régional',
    report: 'Avis de la Région',
    renduLe: '11 mars 2026',
    outAt: AVIS_START + 2.5,
    receivedAt: AVIS_START + 3.1,
  },
];

/**
 * La pièce de l'adoption : sans elle, la validation du dépôt final reste
 * grisée, comme dans l'app.
 */
export const DELIBERATION_ADOPTION = {
  name: "Délibération d'adoption du PCAET",
  file: "Délibération d'adoption.pdf",
  uploadAt: AVIS_START + 3.6,
};

/** Le bouton de validation apparaît avec les avis, et s'arme avec la délibération. */
export const PUBLISH_BUTTON = { appearsAt: AVIS_START + 3.5 };

export const ADOPTION_TIME = AVIS_START + 5.5;

export const ETAPES: {
  title: string;
  description: string;
  start: number;
  end: number;
}[] = [
  {
    title: 'Élaboration',
    description:
      "Dépôt des données du projet de PCAET (diagnostic, objectifs de la stratégie, programme d'actions) et de ses différents documents, jusqu'à la transmission pour avis.",
    start: DIAGNOSTIC_START,
    end: AVIS_START,
  },
  {
    title: 'Transmission pour avis',
    description: 'Consultations auprès du préfet de région.',
    start: AVIS_START,
    end: AVIS_START + 3.2,
  },
  {
    title: 'Prise en compte des avis et délibération',
    description:
      "Consultez les avis rendus, déposez le mémoire de réponse et la délibération d'adoption, puis publiez votre démarche.",
    start: AVIS_START + 3.2,
    end: ADOPTION_TIME,
  },
  {
    title: 'Adoption, publication et mise en œuvre',
    description:
      "PCAET en vigueur jusqu'à sa révision et l'adoption du suivant. Il est accessible au public. Pilotez vos actions et renseignez vos indicateurs durant les 6 ans de mise en œuvre.",
    start: ADOPTION_TIME,
    end: ADOPTION_TIME,
  },
];

export const CONFETTI = { start: ADOPTION_TIME, end: ADOPTION_TIME + 3.5 };

/** Instants des clics simulés (bouton enfoncé pendant `CLICK_DURATION`). */
export const CLICKS = [
  DIAGNOSTIC_START + 11.7,
  DOCUMENTS_START + 6.0,
  PROGRAMME_START + 4.0,
  DELIBERATION_ADOPTION.uploadAt,
  ADOPTION_TIME - 0.2,
];
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

/** Positions des boutons de chaque scène, en coordonnées de scène. */
const WIDE_NEXT_BUTTON = [745, 682] as const;
const COMPACT_PRIMARY_BUTTON = [230, 527] as const;

/** Trajet du curseur, en coordonnées de chaque scène. */
export const CURSOR = {
  wide: sortByTime([
    ...keyframes([
      [0, 640, 430, false],
      [DIAGNOSTIC_START + 1.5, 560, 420, true],
      [DIAGNOSTIC_START + 11.1, ...WIDE_NEXT_BUTTON, true],
      [DOCUMENTS_START + 0.3, 700, 330, true],
      [DOCUMENTS_START + 3.4, 560, 365, true],
      [DOCUMENTS_START + 5.2, ...WIDE_NEXT_BUTTON, true],
      [PROGRAMME_START + 0.2, 560, 330, true],
      [PROGRAMME_START + 3.3, ...WIDE_NEXT_BUTTON, true],
      [AVIS_START + 0.2, 560, 450, true],
      [AVIS_START + 3.3, 722, 357, true],
      [AVIS_START + 4.9, ...WIDE_NEXT_BUTTON, true],
      [ADOPTION_TIME + 3.0, ...WIDE_NEXT_BUTTON, false],
    ]),
    ...vulnerabiliteKeyframes({
      columns: [224, 344, 464],
      firstRowY: 336,
      rowHeight: 30,
    }),
  ]),
  compact: sortByTime([
    ...keyframes([
      [0, 250, 330, false],
      [DIAGNOSTIC_START + 1.5, 250, 300, true],
      [DIAGNOSTIC_START + 11.1, ...COMPACT_PRIMARY_BUTTON, true],
      [DOCUMENTS_START + 0.3, 250, 250, true],
      [DOCUMENTS_START + 5.2, ...COMPACT_PRIMARY_BUTTON, true],
      [PROGRAMME_START + 0.2, 250, 300, true],
      [PROGRAMME_START + 3.3, ...COMPACT_PRIMARY_BUTTON, true],
      [AVIS_START + 0.2, 250, 330, true],
      [AVIS_START + 3.3, 290, 458, true],
      [AVIS_START + 4.9, ...COMPACT_PRIMARY_BUTTON, true],
      [ADOPTION_TIME + 3.0, ...COMPACT_PRIMARY_BUTTON, false],
    ]),
    ...vulnerabiliteKeyframes({
      columns: [202, null, 298],
      firstRowY: 313,
      rowHeight: 22,
    }),
  ]),
};
