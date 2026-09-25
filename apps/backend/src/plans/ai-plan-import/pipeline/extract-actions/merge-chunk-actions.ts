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

// La numérotation peut varier d'une tranche à l'autre quand le modèle la génère.
export const normalizeTitle = (titre: string): string =>
  titre
    .replace(/^[\d.\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

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
  budget: first.budget ?? second.budget,
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
