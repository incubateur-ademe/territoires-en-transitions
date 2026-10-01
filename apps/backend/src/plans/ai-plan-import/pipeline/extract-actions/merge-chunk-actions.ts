import {
  ExtractedAction,
  ExtractedSousAction,
} from '../../models/extracted-action';

/** Dernières actions de la tranche précédente où chercher un doublon. */
const MERGE_WINDOW = 10;

export type ChunkedActions = {
  actions: ExtractedAction[];
  chunkIndexByAction: number[];
};

/**
 * Ajoute les actions d'une tranche. Le chevauchement entre tranches fait
 * extraire deux fois les actions de la jonction : on les fusionne avec celle
 * de la tranche précédente, en gardant le contenu le plus complet.
 */
export const mergeChunkActions = (
  previous: ChunkedActions,
  extracted: ExtractedAction[],
  chunkIndex: number
): ChunkedActions => {
  const actions = [...previous.actions];
  const chunkIndexByAction = [...previous.chunkIndexByAction];
  const candidateIndices = actions
    .map((_, index) => index)
    .filter((index) => chunkIndexByAction[index] === chunkIndex - 1)
    .slice(-MERGE_WINDOW);

  for (const action of extracted) {
    const duplicateIndex = candidateIndices.find(
      (index) =>
        normalizeTitle(actions[index].titre) === normalizeTitle(action.titre)
    );
    if (duplicateIndex === undefined) {
      actions.push(action);
      chunkIndexByAction.push(chunkIndex);
    } else {
      actions[duplicateIndex] = mergeActions(actions[duplicateIndex], action);
    }
  }

  return { actions, chunkIndexByAction };
};

// La numérotation peut varier d'une tranche à l'autre quand le modèle la
// génère, la casse, les accents et la ponctuation selon qu'il recopie un
// titre en capitales ou le sommaire ; « ACTION 3 - » et « 2.1.3 » numérotent
// la même fiche, l'un dans la fiche, l'autre dans le tableau récapitulatif.
export const normalizeTitle = (titre: string): string =>
  titre
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(
      /^(?:fiche(?:[\s-]*actions?)?|action|mesure)\b\s*(?:n[°º]\s*)?\d{1,3}(?:[.-]\d{1,3})*(?!\d)/u,
      ''
    )
    .replace(/^[\d.\s]+/, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/**
 * Fond les actions de même titre, où qu'elles soient dans le document : un
 * titre repris ailleurs (sommaire, rappel) ne doit pas créer une seconde
 * action. La plus complète sert de base, à la place de la première.
 */
export const dedupeByTitle = (merged: ChunkedActions): ChunkedActions => {
  const actions: ExtractedAction[] = [];
  const chunkIndexByAction: number[] = [];
  const positionsByKey = new Map<string, number[]>();
  merged.actions.forEach((action, index) => {
    const key = normalizeTitle(action.titre);
    const positions = key ? positionsByKey.get(key) ?? [] : [];
    const position = positions.find((candidate) =>
      isSameOrEcho(actions[candidate], action)
    );
    if (position === undefined) {
      if (key) {
        positionsByKey.set(key, [...positions, actions.length]);
      }
      actions.push(action);
      chunkIndexByAction.push(merged.chunkIndexByAction[index]);
      return;
    }
    const kept = actions[position];
    const actionIsRicher = contentLength(action) > contentLength(kept);
    actions[position] = actionIsRicher
      ? mergeActions(action, kept)
      : mergeActions(kept, action);
    if (actionIsRicher) {
      chunkIndexByAction[position] = merged.chunkIndexByAction[index];
    }
  });
  return { actions, chunkIndexByAction };
};

/**
 * Un même titre dans deux axes différents est deux actions réelles quand
 * chacune porte son propre contenu (« Sensibiliser le grand public » existe
 * dans plusieurs axes) ; un écho sans contenu (sommaire, rappel) se fond,
 * lui, quel que soit son rattachement.
 */
const isSameOrEcho = (a: ExtractedAction, b: ExtractedAction): boolean => {
  if (contentLength(a) === 0 || contentLength(b) === 0) {
    return true;
  }
  const axeA = normalizeTitle(a.axe);
  const axeB = normalizeTitle(b.axe);
  return axeA === '' || axeB === '' || axeA === axeB;
};

const contentLength = (action: ExtractedAction): number =>
  (action.description?.length ?? 0) +
  (action.objectifs?.length ?? 0) +
  action.sousActions.length * 50;

const richer = (a: string | null, b: string | null): string | null =>
  b !== null && (a === null || b.length > a.length) ? b : a;

export const mergeActions = (
  first: ExtractedAction,
  second: ExtractedAction
): ExtractedAction => ({
  ...first,
  axe: first.axe || second.axe,
  sousAxe: first.sousAxe || second.sousAxe,
  description: richer(first.description, second.description),
  objectifs: richer(first.objectifs, second.objectifs),
  structurePilote: richer(first.structurePilote, second.structurePilote),
  directionServicePilote: richer(
    first.directionServicePilote,
    second.directionServicePilote
  ),
  personnePilote: richer(first.personnePilote, second.personnePilote),
  partenaires: richer(first.partenaires, second.partenaires),
  budget: first.budget ?? second.budget,
  financements: richer(first.financements, second.financements),
  moyensHumains: richer(first.moyensHumains, second.moyensHumains),
  priorite: first.priorite ?? second.priorite,
  dateDebut: first.dateDebut ?? second.dateDebut,
  dateFin: first.dateFin ?? second.dateFin,
  statut: first.statut ?? second.statut,
  sousActions: mergeSousActions(first.sousActions, second.sousActions),
});

const mergeSousActions = (
  first: ExtractedSousAction[],
  second: ExtractedSousAction[]
): ExtractedSousAction[] => {
  const known = new Set(
    first.map((sousAction) => normalizeTitle(sousAction.titre))
  );
  return [
    ...first,
    ...second.filter(
      (sousAction) => !known.has(normalizeTitle(sousAction.titre))
    ),
  ];
};
