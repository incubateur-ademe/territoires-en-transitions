import {
  axisPathOf,
  axisSlotsOf,
  ExtractedAction,
  ExtractedSousAction,
  isPinnedAction,
  withAxisPath,
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
 * Un même titre est deux actions réelles quand chacune porte son propre
 * contenu et qu'un niveau d'axe ou leur numéro les distingue (« Sensibiliser
 * les habitants » en 2.1.3 et en 2.2.4) ; un écho sans contenu (sommaire,
 * rappel) se fond, lui, quel que soit son rattachement.
 */
const isSameOrEcho = (a: ExtractedAction, b: ExtractedAction): boolean => {
  if (contentLength(a) === 0 || contentLength(b) === 0) {
    return true;
  }
  return !axisPathsDiffer(a, b) && !actionNumbersDiffer(a.titre, b.titre);
};

const axisPathsDiffer = (a: ExtractedAction, b: ExtractedAction): boolean => {
  const segmentsA = axisSlotsOf(a);
  const segmentsB = axisSlotsOf(b);
  return Array.from(
    { length: Math.max(segmentsA.length, segmentsB.length) },
    (_, level) => [segmentsA[level] ?? '', segmentsB[level] ?? ''] as const
  ).some(([segmentA, segmentB], level) =>
    level === 1
      ? sousAxesDiffer(segmentA, segmentB)
      : bothSetAndDiffer(normalizeTitle(segmentA), normalizeTitle(segmentB))
  );
};

const bothSetAndDiffer = (a: string, b: string): boolean =>
  a !== '' && b !== '' && a !== b;

const SOUS_AXE_NUMBER = /^\s*(\d{1,2}(?:\.\d{1,2})+)/u;

// « 2.1 » et « 2.1 Parc social » sont le même sous-axe : le numéro prime sur
// le libellé quand les deux en ont un. Quand un seul en a, le libellé de
// l'autre peut être une variante du même sous-axe : rien ne les distingue.
const sousAxesDiffer = (a: string, b: string): boolean => {
  const numberA = a.match(SOUS_AXE_NUMBER)?.[1];
  const numberB = b.match(SOUS_AXE_NUMBER)?.[1];
  if (numberA && numberB) {
    return numberA !== numberB;
  }
  if (numberA || numberB) {
    return false;
  }
  return bothSetAndDiffer(normalizeTitle(a), normalizeTitle(b));
};

const ACTION_NUMBER =
  /^\s*(?:(?:fiche(?:[\s-]*actions?)?|action|mesure)\b\s*(?:n[°º]\s*)?)?(\d{1,3}(?:[.-]\d{1,3})*)(?!\d)/iu;

// Seuls deux numéros de même forme se comparent : « ACTION 3 » dans la fiche
// et « 2.1.3 » dans le tableau récapitulatif désignent la même action.
const actionNumbersDiffer = (a: string, b: string): boolean => {
  const segmentsA = a.match(ACTION_NUMBER)?.[1].split(/[.-]/);
  const segmentsB = b.match(ACTION_NUMBER)?.[1].split(/[.-]/);
  return (
    segmentsA !== undefined &&
    segmentsB !== undefined &&
    segmentsA.length === segmentsB.length &&
    segmentsA.join('.') !== segmentsB.join('.')
  );
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
): ExtractedAction => {
  if (isPinnedAction(second) && !isPinnedAction(first)) {
    return mergeActions(second, first);
  }
  const merged = mergeFields(first, second);
  return first.cheminAxes || second.cheminAxes
    ? withAxisPath(merged, mergeAxisPaths(first, second))
    : merged;
};

// Le chemin de la première l'emporte, sauf s'il n'est que le début de l'autre.
const mergeAxisPaths = (
  first: ExtractedAction,
  second: ExtractedAction
): string[] => {
  const pathA = axisPathOf(first);
  const pathB = axisPathOf(second);
  const isPrefix = pathA.every(
    (segment, level) =>
      normalizeTitle(segment) === normalizeTitle(pathB[level] ?? '')
  );
  return pathB.length > pathA.length && isPrefix ? pathB : pathA;
};

const mergeFields = (
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
