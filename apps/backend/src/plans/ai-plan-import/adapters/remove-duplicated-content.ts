import {
  ExtractedAction,
  ExtractedSousAction,
  isPinnedAction,
} from '../models/extracted-action';

/** Part des mots d'une ligne retrouvés, dans l'ordre, dans un autre champ. */
const NEAR_INCLUSION_RATIO = 0.9;
/** En deçà, une ligne est trop courte pour une inclusion approchée. */
const NEAR_INCLUSION_MIN_WORDS = 4;
/** Une longue ligne faite de noms d'organismes déjà rangés, à quelques mots près. */
const LIST_COVERAGE_RATIO = 0.8;
const LIST_COVERAGE_MIN_WORDS = 5;

const STOP_WORDS = new Set(
  'le la les l de des du d et en a au aux pour sur un une dans par avec ou ses son sa leur leurs ce cette ces qui que est sont'.split(
    ' '
  )
);

// Normalisés comme les lignes : sans accent, en minuscules, au singulier.
const CARTOUCHE_LABELS = [
  'action',
  'fiche action',
  'description',
  'contexte',
  'enjeu',
  'objectif',
  'objectif strategique',
  'objectif operationnel',
  'resultat attendu',
  'trajectoire',
  'cible',
  'commission',
  'thematique',
  'referent',
  'referent interne',
  'referent technique',
  'referent elu',
  'elu referent',
  'pilote',
  'porteur',
  'structure porteuse',
  'structure pilote',
  'service pilote',
  'direction pilote',
  'partenaire',
  'financeur',
  'acteur',
  'acteur mobilise',
  'budget',
  'cout',
  'cout estimatif',
  'cout estime',
  'financement',
  'plan de financement',
  'moyen',
  'moyen humain',
  'moyen financier',
  'calendrier',
  'echeance',
  'echeancier',
  'duree',
  'statut',
  'etat d avancement',
  'avancement',
  'priorite',
  'indicateur',
  'indicateur de suivi',
  'suivi',
  'nouvelle',
  'en cour',
  'a venir',
  'realise',
  'realisee',
  'engagee',
  'a definir',
  'nc',
  'non renseigne',
].map((label) => label.split(' '));
const MAX_LABEL_WORDS = Math.max(...CARTOUCHE_LABELS.map((l) => l.length));
const LABEL_KEYS = new Set(CARTOUCHE_LABELS.map((label) => label.join(' ')));

const LEADING_ENUMERATOR =
  /^\s*(?:[-•*–—▪●◦]+|\(?(?:\d{1,2}|[a-z]|[ivx]{1,4})[).°](?!\d)|\d{1,2}\s*[-–](?!\d))\s*/iu;

export type RemovedDuplicatedContent = {
  actions: ExtractedAction[];
  /** Lignes de description retirées : doublons d'un autre champ ou libellés seuls. */
  descriptionLines: number;
  /** Sous-actions retirées parce qu'elles reprennent un objectif. */
  sousActions: number;
};

/**
 * Le modèle recopie parfois toute la fiche dans la description, cartouche
 * compris, et fait des sous-actions de ses objectifs, alors qu'il a aussi
 * rangé ces informations dans leurs champs. Ne retire que des doublons
 * avérés, sans jamais réécrire un texte ; une action lue dans un tableur est
 * laissée telle quelle.
 */
export const removeDuplicatedContent = (
  actions: ExtractedAction[]
): RemovedDuplicatedContent => {
  let descriptionLines = 0;
  let sousActions = 0;
  const cleaned = actions.map((action) => {
    if (isPinnedAction(action)) {
      return action;
    }
    const keptSousActions = action.sousActions.filter(
      (sousAction) => !repeatsAnObjectif(sousAction, action.objectifs)
    );
    sousActions += action.sousActions.length - keptSousActions.length;
    const withSousActions = { ...action, sousActions: keptSousActions };
    if (!action.description) {
      return withSousActions;
    }
    const { description, removed } = removeDuplicatedLines(
      action.description,
      withSousActions
    );
    descriptionLines += removed;
    return removed > 0 ? { ...withSousActions, description } : withSousActions;
  });
  return { actions: cleaned, descriptionLines, sousActions };
};

const removeDuplicatedLines = (
  text: string,
  action: ExtractedAction
): { description: string | null; removed: number } => {
  const corpus = buildCorpus(action);
  const lines = text.split('\n');
  const removable = lines.map(
    (line) => isLabelOnly(line) || isDuplicated(line, corpus)
  );
  // Un intertitre « … : » reste tant que la ligne qu'il introduit reste.
  for (let index = lines.length - 1; index >= 0; index--) {
    if (removable[index] && lines[index].trim().endsWith(':')) {
      const next = nextNonEmptyIndex(lines, index);
      if (next !== null && !removable[next]) {
        removable[index] = false;
      }
    }
  }
  const removed = lines.filter(
    (line, index) => removable[index] && line.trim() !== ''
  ).length;
  if (removed === 0) {
    return { description: text, removed: 0 };
  }
  const kept = lines
    .filter((_, index) => !removable[index])
    .join('\n')
    .replace(/\n\s*\n(\s*\n)+/g, '\n\n')
    .trim();
  return { description: kept === '' ? null : kept, removed };
};

const nextNonEmptyIndex = (lines: string[], from: number): number | null => {
  for (let index = from + 1; index < lines.length; index++) {
    if (lines[index].trim() !== '') {
      return index;
    }
  }
  return null;
};

type Corpus = {
  title: string[];
  /** Chaque champ texte, et chacune de ses lignes, en mots normalisés. */
  segments: string[][];
  /** Les mots des champs qui listent des organismes ou des personnes. */
  listWords: Set<string>;
};

const buildCorpus = (action: ExtractedAction): Corpus => {
  const texts = [
    action.objectifs,
    action.moyensHumains,
    action.financements,
    action.budget === null ? null : String(action.budget),
    action.structurePilote,
    action.directionServicePilote,
    action.personnePilote,
    action.partenaires,
    ...action.sousActions.flatMap((sousAction) => [
      sousAction.titre,
      sousAction.description,
    ]),
  ].filter((text): text is string => Boolean(text?.trim()));
  const segments = texts
    .flatMap((text) => [text, ...text.split('\n')])
    .map(lineWords)
    .filter((words) => words.length > 0);
  const listWords = new Set(
    [
      action.structurePilote,
      action.directionServicePilote,
      action.personnePilote,
      action.partenaires,
      action.financements,
    ].flatMap((text) => (text ? significant(lineWords(text)) : []))
  );
  return { title: lineWords(action.titre), segments, listWords };
};

const isDuplicated = (line: string, corpus: Corpus): boolean => {
  const words = lineWords(withoutLeadingLabels(line));
  const meaningful = significant(words);
  if (meaningful.length === 0) {
    return false;
  }
  if (similarity(words, corpus.title) >= NEAR_INCLUSION_RATIO) {
    return true;
  }
  const joined = ` ${words.join(' ')} `;
  if (
    corpus.segments.some((segment) => ` ${segment.join(' ')} `.includes(joined))
  ) {
    return true;
  }
  const numbers = meaningful.filter(isNumber);
  if (
    meaningful.length >= NEAR_INCLUSION_MIN_WORDS &&
    corpus.segments.some((segment) => {
      const segmentWords = significant(segment);
      return (
        numbers.every((number) => segmentWords.includes(number)) &&
        lcsLength(meaningful, segmentWords) / meaningful.length >=
          NEAR_INCLUSION_RATIO
      );
    })
  ) {
    return true;
  }
  if (!numbers.every((number) => corpus.listWords.has(number))) {
    return false;
  }
  const covered = meaningful.filter((word) =>
    corpus.listWords.has(word)
  ).length;
  return (
    covered === meaningful.length ||
    (meaningful.length >= LIST_COVERAGE_MIN_WORDS &&
      covered / meaningful.length >= LIST_COVERAGE_RATIO)
  );
};

/** Un libellé de cartouche seul (« Référent interne », « Structure porteuse Partenaires/Financeurs »). */
const isLabelOnly = (line: string): boolean => {
  const words = lineWords(line);
  return words.length > 0 && splitsIntoLabels(words);
};

const splitsIntoLabels = (words: string[]): boolean => {
  const reachable = new Array<boolean>(words.length + 1).fill(false);
  reachable[0] = true;
  for (let start = 0; start < words.length; start++) {
    if (!reachable[start]) {
      continue;
    }
    for (
      let size = 1;
      size <= MAX_LABEL_WORDS && start + size <= words.length;
      size++
    ) {
      if (LABEL_KEYS.has(words.slice(start, start + size).join(' '))) {
        reachable[start + size] = true;
      }
    }
  }
  return reachable[words.length];
};

/** « Budget : 115 000 € » se compare par sa valeur. */
const withoutLeadingLabels = (line: string): string => {
  const colon = line.indexOf(':');
  if (colon < 0) {
    return line;
  }
  const head = lineWords(line.slice(0, colon));
  return head.length > 0 && splitsIntoLabels(head)
    ? line.slice(colon + 1)
    : line;
};

const repeatsAnObjectif = (
  sousAction: ExtractedSousAction,
  objectifs: string | null
): boolean => {
  if (
    !objectifs ||
    sousAction.personnePilote ||
    sousAction.statut ||
    sousAction.dateDebut ||
    sousAction.dateFin
  ) {
    return false;
  }
  const objectifLines = objectifs
    .split('\n')
    .map(lineWords)
    .filter((words) => words.length > 0);
  const title = lineWords(sousAction.titre);
  if (
    title.length === 0 ||
    !objectifLines.some(
      (objectif) => similarity(title, objectif) >= NEAR_INCLUSION_RATIO
    )
  ) {
    return false;
  }
  // Une description propre à la sous-action en fait plus qu'un objectif.
  const description = sousAction.description
    ? ` ${lineWords(sousAction.description).join(' ')} `
    : null;
  return (
    description === null ||
    description.trim() === '' ||
    ` ${lineWords(objectifs).join(' ')} `.includes(description)
  );
};

/** Mots communs dans l'ordre, rapportés au plus long des deux. */
const similarity = (left: string[], right: string[]): number =>
  left.length === 0 || right.length === 0
    ? 0
    : lcsLength(left, right) / Math.max(left.length, right.length);

const lcsLength = (left: string[], right: string[]): number => {
  let previous = new Array<number>(right.length + 1).fill(0);
  for (const word of left) {
    const current = new Array<number>(right.length + 1).fill(0);
    for (let index = 0; index < right.length; index++) {
      current[index + 1] =
        word === right[index]
          ? previous[index] + 1
          : Math.max(previous[index + 1], current[index]);
    }
    previous = current;
  }
  return previous[right.length];
};

/** Mots sans casse, accents, ponctuation, puce ni numéro de liste, au singulier. */
const lineWords = (text: string): string[] => {
  let normalized = text
    .replace(LEADING_ENUMERATOR, '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
  // « 115 000 » et « 115000 » : un seul nombre.
  let previous;
  do {
    previous = normalized;
    normalized = normalized.replace(/(\d)[\s.](?=\d{3}(?!\d))/g, '$1');
  } while (normalized !== previous);
  return normalized
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0)
    .map((word) =>
      word.length > 3 && !isNumber(word) ? word.replace(/[sx]$/, '') : word
    );
};

const significant = (words: string[]): string[] =>
  words.filter((word) => !STOP_WORDS.has(word));

const isNumber = (word: string): boolean => /^\d+$/.test(word);
