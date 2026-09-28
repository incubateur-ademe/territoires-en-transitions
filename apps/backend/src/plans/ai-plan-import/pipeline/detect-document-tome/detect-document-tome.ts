import { isTabularKind, ReadDocument } from '../document/document-page';

/**
 * Détection déterministe du tome déposé, avant tout appel au modèle : un
 * PCAET se publie en plusieurs tomes (diagnostic, stratégie, programme
 * d'actions, évaluation environnementale stratégique) et seul le programme
 * d'actions s'importe. Repérer un mauvais tome dès la lecture évite un import
 * long, coûteux et sans action à la clé.
 *
 * L'import est aussi utilisé hors PCAET : ne sont refusés que les tomes qui
 * ne contiennent jamais de fiches actions (EES, diagnostic). Une « stratégie »
 * passe, car un plan stratégique légitime peut porter des fiches.
 */

export type WrongTome = 'evaluation_environnementale' | 'diagnostic';

export type TomeDetection =
  | { verdict: 'ok' }
  | { verdict: 'wrong_tome'; tome: WrongTome; evidence: string };

/** La zone de titre : page de garde et sommaire tiennent dans les premières pages. */
const TITLE_ZONE_PAGES = 6;
/** Une ligne de titre ou de sommaire est courte ; au-delà c'est de la prose. */
const MAX_TITLE_LINE_LENGTH = 100;

/**
 * Les titres sont ancrés en début de ligne : « Incidences du programme
 * d'actions » dans le sommaire d'une EES ne doit pas passer pour un titre.
 * Seule tolérance, une mention du PCAET en tête ("PCAET — Programme
 * d'actions", "PCAET de Lyon : Fiches actions").
 */
const withTitlePrefix = (pattern: RegExp): RegExp =>
  new RegExp(
    `^(?:pcaet\\b(?:[^:\\-–—]{0,40}[:\\-–—]+)?\\s*)?${pattern.source.replace(
      /^\^/,
      ''
    )}`,
    pattern.flags
  );

/**
 * Marqueurs positifs : le document s'annonce comme un programme d'actions.
 * Ils l'emportent toujours, y compris sur un tome global qui contient aussi
 * le diagnostic ou la stratégie.
 */
const ACTION_PLAN_TITLES = [
  /^(?:le\s+)?(?:programme|plan)\s+d['’]actions?\b/i,
  /^fiches?[\s-]actions?\b/i,
  /^catalogue des actions\b/i,
  /^plan op[ée]rationnel\b/i,
].map(withTitlePrefix);

/** Marqueurs forts : le titre d'un autre tome, à lui seul suffisant. */
const WRONG_TOME_TITLES = (
  [
    {
      pattern: /^[ée]valuation environnementale(?:\s+strat[ée]gique)?\b/i,
      tome: 'evaluation_environnementale',
    },
    {
      pattern: /^r[ée]sum[ée] non technique\b/i,
      tome: 'evaluation_environnementale',
    },
    { pattern: /^diagnostic$/i, tome: 'diagnostic' },
    {
      pattern: /^diagnostic\s+(?:territorial|climat[\s-]air[\s-][ée]nergie)\b/i,
      tome: 'diagnostic',
    },
  ] satisfies { pattern: RegExp; tome: WrongTome }[]
).map(({ pattern, tome }) => ({ pattern: withTitlePrefix(pattern), tome }));

/**
 * Indices faibles d'une EES, cherchés n'importe où dans la ligne : aucun ne
 * suffit seul (un programme d'actions peut citer Natura 2000), il en faut
 * deux de familles différentes.
 */
const EES_HINTS = [
  /mesures?\s+(?:d['’][ée]vitement|de r[ée]duction|de compensation)|s[ée]quence\s+erc|mesures\s+erc/i,
  /incidences?\s+(?:sur l['’]environnement|du (?:pcaet|plan)|notables?|natura\s*2000)/i,
  /[ée]tat initial de l['’]environnement/i,
];

export const detectDocumentTome = (document: ReadDocument): TomeDetection => {
  if (isTabularKind(document.kind)) {
    return { verdict: 'ok' };
  }
  const lines = titleZoneLines(document);

  const claimsActionPlan = lines.some((line) =>
    ACTION_PLAN_TITLES.some((pattern) => pattern.test(line))
  );
  if (claimsActionPlan) {
    return { verdict: 'ok' };
  }

  for (const line of lines) {
    const wrongTitle = WRONG_TOME_TITLES.find(({ pattern }) =>
      pattern.test(line)
    );
    if (wrongTitle) {
      return { verdict: 'wrong_tome', tome: wrongTitle.tome, evidence: line };
    }
  }

  // Deux familles d'indices sur deux lignes distinctes : une seule ligne
  // d'annexe (« Mesures ERC et incidences Natura 2000 ») ne suffit pas.
  const eesEvidence = [
    ...new Set(
      EES_HINTS.map((pattern) =>
        lines.find((line) => pattern.test(line))
      ).filter((line): line is string => line !== undefined)
    ),
  ];
  if (eesEvidence.length >= 2) {
    return {
      verdict: 'wrong_tome',
      tome: 'evaluation_environnementale',
      evidence: eesEvidence[0],
    };
  }

  return { verdict: 'ok' };
};

/** Les lignes courtes des premières pages lues, nettoyées pour la comparaison. */
const titleZoneLines = (document: ReadDocument): string[] =>
  document.pages
    .filter((page) => page.source !== 'empty')
    .slice(0, TITLE_ZONE_PAGES)
    .flatMap((page) => page.text.split('\n'))
    .map(cleanTitleLine)
    .filter((line) => line.length > 0 && line.length <= MAX_TITLE_LINE_LENGTH);

const cleanTitleLine = (line: string): string =>
  line
    // Pointillés et numéro de page d'une entrée de sommaire.
    .replace(/[.\s·…]{3,}\s*\d+\s*$/u, '')
    // Numérotation en tête : "3.", "II -", "Partie 2 :", "Tome IV.".
    .replace(/^\s*(?:partie|tome|livret|volet|cahier)\s+/i, '')
    // Chiffres romains en capitales et avec séparateur seulement,
    // sinon "Diagnostic" perdrait son D.
    .replace(/^\s*(?:\d+(?:\.\d+)*|[IVXLCDM]+)\s*[.):\-–—:]+\s*/, '')
    .trim();
