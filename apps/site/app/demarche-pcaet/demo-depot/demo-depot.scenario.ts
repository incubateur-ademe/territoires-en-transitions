import { creerTimeline } from '@/site/components/demo-animee/timeline';

/**
 * Scénario de la démo du dépôt PCAET, en temps de scène (secondes). Chaque
 * écran se termine par une pause de lecture, le temps de le lire.
 */
export const TIMELINE_DEPOT = creerTimeline({
  duree: 32,
  pauses: [4.95, 11.9, 16.2, 20.6],
  dureePause: 1.5,
});

/** Écran figé quand les animations sont réduites : avis reçus, prêt à adopter. */
export const INSTANT_FIXE_SCENE = 21.2;

export const ECRANS = [
  { ecran: 'documents', debut: 0, chapitre: '1. Documents' },
  { ecran: 'diagnostic', debut: 6.4, chapitre: '2. Diagnostic' },
  { ecran: 'programme', debut: 13, chapitre: "3. Programme d'actions" },
  { ecran: 'avis', debut: 17.3, chapitre: '4. Avis et adoption' },
] as const;

export type EcranDepot = (typeof ECRANS)[number]['ecran'];

/** Document déposé par la démo : instant où le fichier arrive, et son nom. */
type Depot = { instant: number; fichier: string };

export const DOCUMENTS: {
  nom: string;
  obligatoire: boolean;
  description?: string;
  /** Sans dépôt, la pièce est déclarée incluse dans le « PCAET global ». */
  depot?: Depot;
}[] = [
  {
    nom: 'PCAET global',
    obligatoire: false,
    description:
      'Document unique regroupant une partie des pièces obligatoires attendues.',
    depot: { instant: 0.8, fichier: 'PCAET Global.pdf' },
  },
  {
    nom: "Délibération d'engagement / déclaration d'intention",
    obligatoire: false,
    depot: { instant: 2.4, fichier: 'Délibération engagement.pdf' },
  },
  { nom: 'Diagnostic', obligatoire: true },
  { nom: 'Stratégie territoriale', obligatoire: true },
  { nom: "Programme d'actions", obligatoire: true },
  { nom: "Dispositif de suivi et d'évaluation", obligatoire: true },
  { nom: 'EES (évaluation environnementale stratégique)', obligatoire: true },
  {
    nom: 'Bilan du PCAET précédent',
    obligatoire: true,
    depot: { instant: 3.4, fichier: 'Bilan PCAET précédent.pdf' },
  },
  { nom: "Délibération d'arrêt du PCAET", obligatoire: true },
];

/** Les inclusions se cochent une à une, une fois le PCAET global déposé. */
export const INCLUSIONS = { debut: 2.3, pas: 0.12 };

export const VOLETS: {
  nom: string;
  court: string;
  unite: string;
  optionnel: boolean;
  /** Tracé SVG (viewBox 24) de l'icône du volet. */
  icone: string;
  /** Instants où le volet devient le volet affiché, puis complété. */
  ouverture: number;
  completion: number;
}[] = [
  {
    nom: 'Émissions GES',
    court: 'GES',
    unite: 'kteq CO2',
    optionnel: false,
    icone: 'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z',
    ouverture: 0,
    completion: 9.2,
  },
  {
    nom: 'Polluants atmosphériques',
    court: 'Polluants',
    unite: 't',
    optionnel: false,
    icone:
      'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M5 5h.01M19 5h.01M5 19h.01M19 19h.01M12 4h.01M12 20h.01',
    ouverture: 9.5,
    completion: 9.85,
  },
  {
    nom: 'Séquestration carbone',
    court: 'Séquestration',
    unite: 'kteq CO2',
    optionnel: true,
    icone:
      'M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 12c0-4 3-6 7-6 0 4-3 6-7 6z',
    ouverture: 9.95,
    completion: 10.3,
  },
  {
    nom: 'Consommation énergétique finale',
    court: 'Consommation',
    unite: 'GWh',
    optionnel: false,
    icone: 'M13 2L4 14h7l-1 8 9-12h-7z',
    ouverture: 10.4,
    completion: 10.75,
  },
  {
    nom: 'Énergies renouvelables',
    court: 'EnR',
    unite: 'GWh',
    optionnel: false,
    icone:
      'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
    ouverture: 10.85,
    completion: 11.2,
  },
  {
    nom: 'Vulnérabilité du territoire',
    court: 'Vulnérabilité',
    unite: 'indice',
    optionnel: true,
    icone: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
    ouverture: 11.3,
    completion: 11.65,
  },
];

export const ANNEES_DIAGNOSTIC = [2026, 2030, 2036, 2050];

export const SECTEURS = [
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
export const VALEURS_GES = [
  [650, 410, 12, 3],
  [120, 100, 80, 60],
  [120, 100, 50, 35],
  [15, 12, 14, 15],
  [1330, 1200, 950, 600],
  [700, 500, 200, 100],
  [300, 200, 100, 80],
  [150, 120, 75, 56],
];

export const IMPORT_PROGRAMME = {
  fichier: "Programme d'actions.pdf",
  vol: 13.8,
  chargement: 14.3,
  termine: 15.3,
  nombreActions: 62,
  verification: 15.9,
  validation: 16.0,
};

export const SOUS_ETAPES_ELABORATION: {
  titre: string;
  court: string;
  description: string;
  completion: number;
  ecran: EcranDepot;
}[] = [
  {
    titre: 'Ajouter les documents attendus',
    court: 'Documents',
    description: 'Déposez les pièces usuelles du dossier.',
    completion: 4.9,
    ecran: 'documents',
  },
  {
    titre: 'Compléter le diagnostic et les objectifs',
    court: 'Diagnostic',
    description: 'Renseignez les indicateurs par volet.',
    completion: 11.8,
    ecran: 'diagnostic',
  },
  {
    titre: "Renseigner le programme d'actions",
    court: 'Programme',
    description: "Rattachez, créez ou importez un plan d'actions.",
    completion: 16.0,
    ecran: 'programme',
  },
];

export const ADOPTION = 22.0;

export const ETAPES: {
  titre: string;
  description: string;
  debut: number;
  fin: number;
}[] = [
  {
    titre: 'Élaboration',
    description:
      "Dépôt du diagnostic, des objectifs, du programme d'actions et des pièces jointes.",
    debut: 0,
    fin: 17.3,
  },
  {
    titre: 'Transmis pour avis',
    description:
      'Consultations auprès du conseil régional et du préfet de région.',
    debut: 17.3,
    fin: 20.5,
  },
  {
    titre: 'Consultation des avis et délibération',
    description:
      'Consultez les avis rendus, puis délibérez pour adopter le plan.',
    debut: 20.5,
    fin: ADOPTION,
  },
  {
    titre: 'Adoption',
    description: 'PCAET adopté, publié et mis en œuvre.',
    debut: ADOPTION,
    fin: ADOPTION,
  },
];

export const AVIS = [
  {
    emetteur: 'la DREAL',
    rapport: 'Rapport DREAL',
    fichier: 'Rapport DREAL.pdf',
    origine: 'Préfet de région – avis rendu',
    sortie: 18.9,
    reception: 19.5,
  },
  {
    emetteur: 'la Région',
    rapport: 'Rapport Région',
    fichier: 'Rapport Région.pdf',
    origine: 'Conseil régional – avis rendu',
    sortie: 19.8,
    reception: 20.4,
  },
];

export const COURRIER = { arrivee: 17.9, ouverture: 18.6 };

export const BOUTON_ADOPTER = { apparition: 20.8 };

export const CONFETTIS = { debut: ADOPTION, fin: 25.5 };

/** Instants des clics simulés (bouton enfoncé pendant 0,25 s). */
export const CLICS = [6.0, 12.6, 17.0, 21.8];
export const DUREE_CLIC = 0.25;

type JalonCurseur = { instant: number; x: number; y: number; visible: boolean };

const jalons = (points: [number, number, number, boolean][]): JalonCurseur[] =>
  points.map(([instant, x, y, visible]) => ({ instant, x, y, visible }));

/** Trajet du curseur, en coordonnées de chaque scène. */
export const CURSEUR = {
  large: jalons([
    [0, 640, 430, false],
    [5.0, 745, 682, true],
    [6.6, 560, 420, true],
    [12.0, 745, 682, true],
    [13.2, 600, 330, true],
    [16.4, 745, 682, true],
    [17.5, 560, 450, true],
    [21.1, 745, 682, true],
    [22.3, 700, 560, true],
    [25.2, 700, 560, false],
  ]),
  compact: jalons([
    [0, 250, 330, false],
    [5.0, 230, 527, true],
    [6.6, 250, 300, true],
    [12.0, 230, 527, true],
    [13.2, 250, 250, true],
    [16.4, 230, 527, true],
    [17.5, 250, 330, true],
    [21.1, 230, 527, true],
    [22.3, 250, 420, true],
    [25.2, 250, 420, false],
  ]),
};
