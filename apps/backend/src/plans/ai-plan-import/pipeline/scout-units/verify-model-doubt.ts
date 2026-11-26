import type {
  AnalysisAbandonedError,
  DoubtEvidence,
  ModelDoubt,
  ReadingStats,
} from '../../models/model-doubt';
import { isGarbledText, isMostlyUnreadable } from '../document/reading-stats';
import type { DocumentUnit } from '../segment-document/document-unit';
import {
  countFiches,
  countNumberedActions,
} from '../segment-document/list-actions-without-fiche';

const MAX_CITATIONS = 4;
// « Plan », « Axe 1 » se trouvent partout : une preuve se lit en entier.
const MIN_CITATION_CHARS = 8;
const MAX_CITATION_LENGTH = 160;
export const MAX_EXPLANATION_LENGTH = 300;
// Au-delà, le document a de quoi faire des actions, quoi qu'en dise le modèle.
const MAX_FICHES_WITHOUT_ACTION = 2;
const MAX_NUMBERED_ACTIONS_WITHOUT_ACTION = 2;
// Au-delà, un vrai plan a été lu malgré les pages perdues : il vaut mieux
// l'importer que tout arrêter.
const MAX_FICHES_WHEN_UNREADABLE = 10;

/** Ce que le code sait du document, de quoi confirmer ou non un doute. */
export type DoubtFacts = {
  /** Toutes les unités lues, celles que le tri écarte comprises. */
  units: DocumentUnit[];
  /** Le tri a vu au moins une fiche action. */
  sortedAsFiche: boolean;
  /** Un lot du tri en échec : ses unités n'ont pas été vues. */
  sortingFailed: boolean;
  readingStats?: ReadingStats;
  /** L'utilisateur a dit comment ranger les thèmes : la grille est tranchée. */
  themeGroupingAnswered: boolean;
  /** Les actions d'un tableur que le code a lues lui-même. */
  actionsReadByCode: number;
};

export type ModelDoubtJudgement = {
  abandon: AnalysisAbandonedError | null;
  /** Un doute qui n'arrête rien, noté pour caler les seuils. */
  warning: string | null;
  details: Record<string, number>;
};

/**
 * Le modèle propose, le code dispose : ses citations doivent toutes se
 * retrouver dans le document, et un fait du document doit lui donner raison.
 * Plusieurs plans ou des grilles concurrentes n'ont pas de tel fait : les
 * citations suffisent, sauf quand l'utilisateur a déjà tranché les thèmes.
 */
export const judgeModelDoubt = (
  doubt: ModelDoubt,
  facts: DoubtFacts
): ModelDoubtJudgement => {
  const evidence = findDoubtEvidence(doubt.citations, facts.units);
  const confirmed = evidence !== null && confirmsDoubt(doubt, facts);
  const explanation = truncate(
    doubt.explication.trim(),
    MAX_EXPLANATION_LENGTH
  );
  const details = {
    [`modelDoubt:${doubt.motif}`]: 1,
    modelDoubtVerified: evidence === null ? 0 : 1,
    modelDoubtConfirmed: confirmed ? 1 : 0,
  };
  if (evidence !== null && confirmed) {
    return {
      abandon: {
        kind: 'analysis_abandoned',
        motif: doubt.motif,
        evidence,
        explanation,
        ...(doubt.motif === 'texte-illisible' &&
          facts.readingStats && { readingStats: facts.readingStats }),
      },
      warning: null,
      details,
    };
  }
  return {
    abandon: null,
    // Ni l'explication ni les citations : les avertissements partent dans les
    // journaux, et les mots du modèle citent le document.
    warning: `Doute du modèle « ${doubt.motif} » ${
      evidence === null
        ? 'écarté : citation introuvable dans le document'
        : 'non confirmé par le document'
    }`,
    details,
  };
};

const confirmsDoubt = (
  { motif, citations }: ModelDoubt,
  facts: DoubtFacts
): boolean => {
  switch (motif) {
    case 'aucune-action':
      return (
        facts.actionsReadByCode === 0 &&
        !facts.sortedAsFiche &&
        !facts.sortingFailed &&
        countFiches(facts.units) <= MAX_FICHES_WITHOUT_ACTION &&
        !facts.units.some((unit) => unit.kind === 'table') &&
        countNumberedActions(facts.units) <= MAX_NUMBERED_ACTIONS_WITHOUT_ACTION
      );
    // Des citations toutes bien lues prouvent le contraire de leur motif, et
    // des fiches lues en nombre font un plan malgré les pages perdues.
    case 'texte-illisible':
      return (
        isMostlyUnreadable(facts.readingStats) &&
        citations.some(isGarbledText) &&
        countFiches(facts.units) <= MAX_FICHES_WHEN_UNREADABLE
      );
    case 'plusieurs-plans':
      return true;
    case 'grilles-concurrentes':
      return !facts.themeGroupingAnswered;
  }
};

/**
 * Chaque citation, à sa page, ou rien dès qu'une manque. La comparaison ignore
 * accents, casse et ponctuation, jamais un mot : une citation tient dans une
 * unité, éventuellement sur plusieurs de ses lignes.
 */
export const findDoubtEvidence = (
  citations: string[],
  units: DocumentUnit[]
): DoubtEvidence[] | null => {
  const cited = citations
    .map(cleanCitation)
    .filter((citation) => citation !== '')
    .slice(0, MAX_CITATIONS);
  if (cited.length === 0) {
    return null;
  }
  const indexed = units.map(indexUnit);
  const evidence: DoubtEvidence[] = [];
  for (const citation of cited) {
    const needle = normalize(citation);
    if (needle.replace(/ /g, '').length < MIN_CITATION_CHARS) {
      return null;
    }
    const page = findPage(indexed, needle);
    if (page === null) {
      return null;
    }
    evidence.push({ citation: truncate(citation, MAX_CITATION_LENGTH), page });
  }
  return evidence;
};

type IndexedUnit = {
  /** Le texte normalisé, encadré d'espaces pour ne trouver que des mots entiers. */
  text: string;
  lineStarts: { offset: number; page: number }[];
};

const indexUnit = (unit: DocumentUnit): IndexedUnit => {
  let text = ' ';
  const lineStarts: IndexedUnit['lineStarts'] = [];
  for (const line of unit.lines) {
    const normalized = normalize(line.text);
    if (normalized === '') continue;
    lineStarts.push({ offset: text.length, page: line.pageIndex + 1 });
    text += `${normalized} `;
  }
  return { text, lineStarts };
};

const findPage = (units: IndexedUnit[], needle: string): number | null => {
  for (const unit of units) {
    const at = unit.text.indexOf(` ${needle} `);
    if (at === -1) continue;
    const line = unit.lineStarts
      .filter(({ offset }) => offset <= at + 1)
      .at(-1);
    return line?.page ?? null;
  }
  return null;
};

const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

// Les guillemets et points de suspension qui encadrent une citation n'en sont pas.
const cleanCitation = (citation: string): string =>
  citation
    .trim()
    .replace(/^[«"“'‘\s…]+|[»"”'’\s…]+$/gu, '')
    .replace(/^\.{3}|\.{3}$/g, '')
    .trim();

const truncate = (text: string, max: number): string => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};
