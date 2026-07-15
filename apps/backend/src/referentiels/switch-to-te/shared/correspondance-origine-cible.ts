import {
  ActionTypeEnum,
  getActionTypeFromActionId,
  getLevelFromActionId,
  getReferentielIdFromActionId,
  type ActionScore,
  type ActionType,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { isCibleConcernee, type ActionCible } from './action-cible';
import { resolveMesureOrigineId } from './action-origine';

type MesureMappingKind = 'direct' | 'indirect';

type MesureOrigineMapping = {
  teActionId: string;
  kind: MesureMappingKind;
};

export type CorrespondanceOrigineCibleIndexes = {
  /** origine source → sous-actions TE candidates (correspondance directe) */
  directSousActionByOrigineId: ReadonlyMap<string, readonly string[]>;
  /** origine source → mesures TE candidates (directe ou via mesure ancêtre) */
  mesureByOrigineId: ReadonlyMap<string, readonly MesureOrigineMapping[]>;
};

const SOUS_MESURE_LEVEL_THRESHOLD = 4;

const registerDirectSousActionMapping = (
  index: Map<string, Set<string>>,
  origineKey: string,
  teActionId: string
): void => {
  const targets = index.get(origineKey) ?? new Set<string>();
  targets.add(teActionId);
  index.set(origineKey, targets);
};

const registerMesureMapping = (
  index: Map<string, Map<string, MesureMappingKind>>,
  origineKey: string,
  teActionId: string,
  kind: MesureMappingKind
): void => {
  const targets = index.get(origineKey) ?? new Map<string, MesureMappingKind>();
  const existingKind = targets.get(teActionId);

  if (existingKind === undefined || kind === 'direct') {
    targets.set(teActionId, existingKind === 'direct' ? 'direct' : kind);
  }

  index.set(origineKey, targets);
};

const freezeDirectIndex = (
  index: Map<string, Set<string>>
): ReadonlyMap<string, readonly string[]> =>
  new Map(
    [...index.entries()].map(([origineKey, targets]) => [
      origineKey,
      [...targets],
    ])
  );

const freezeMesureIndex = (
  index: Map<string, Map<string, MesureMappingKind>>
): ReadonlyMap<string, readonly MesureOrigineMapping[]> =>
  new Map(
    [...index.entries()].map(([origineKey, targets]) => [
      origineKey,
      [...targets.entries()].map(([teActionId, kind]) => ({
        teActionId,
        kind,
      })),
    ])
  );

const resolveConcernedTeActionIds = (
  candidates: readonly string[] | undefined,
  teScoreMap: Map<string, ActionScore>
): readonly string[] => {
  if (!candidates?.length) {
    return [];
  }

  return candidates
    .filter((teActionId) => isCibleConcernee(teScoreMap, teActionId))
    .toSorted();
};

const resolveConcernedMesureTeActionIds = (
  mappings: readonly MesureOrigineMapping[] | undefined,
  teScoreMap: Map<string, ActionScore>
): readonly string[] => {
  if (!mappings?.length) {
    return [];
  }

  const concernedMappings = mappings.filter((mapping) =>
    isCibleConcernee(teScoreMap, mapping.teActionId)
  );

  if (concernedMappings.length === 0) {
    return [];
  }

  const directMappings = concernedMappings.filter(
    (mapping) => mapping.kind === 'direct'
  );
  const candidateMappings =
    directMappings.length > 0 ? directMappings : concernedMappings;

  return [
    ...new Set(candidateMappings.map((mapping) => mapping.teActionId)),
  ].toSorted();
};

const isSousMesureLevel = (sourceActionId: string): boolean =>
  getLevelFromActionId(sourceActionId) >= SOUS_MESURE_LEVEL_THRESHOLD;

const isSourceSousMesure = (
  sourceActionId: string,
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>
): boolean => {
  const referentielId = getReferentielIdFromActionId(sourceActionId);
  const hierarchie = hierarchiesByReferentielId.get(referentielId);

  if (!hierarchie) {
    return isSousMesureLevel(sourceActionId);
  }

  const actionType = getActionTypeFromActionId(sourceActionId, hierarchie);
  return (
    actionType === ActionTypeEnum.SOUS_ACTION ||
    actionType === ActionTypeEnum.TACHE
  );
};

export const buildCorrespondanceIndexes = (input: {
  sousActionsEtTaches: ActionCible[];
  mesures: ActionCible[];
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>;
}): CorrespondanceOrigineCibleIndexes => {
  const directSousActionByOrigineId = new Map<string, Set<string>>();
  const mesureByOrigineId = new Map<string, Map<string, MesureMappingKind>>();

  for (const cible of input.sousActionsEtTaches) {
    if (!cible.concernee) {
      continue;
    }

    for (const origine of cible.originesConcernees) {
      registerDirectSousActionMapping(
        directSousActionByOrigineId,
        origine.actionId,
        cible.actionId
      );
    }
  }

  for (const cible of input.mesures) {
    if (!cible.concernee) {
      continue;
    }

    for (const origine of cible.originesConcernees) {
      registerMesureMapping(
        mesureByOrigineId,
        origine.actionId,
        cible.actionId,
        'direct'
      );

      const mesureOrigineId = resolveMesureOrigineId(
        {
          referentielId: origine.referentielId,
          actionId: origine.actionId,
        },
        input.hierarchiesByReferentielId
      );

      if (mesureOrigineId !== origine.actionId) {
        registerMesureMapping(
          mesureByOrigineId,
          mesureOrigineId,
          cible.actionId,
          'indirect'
        );
      }
    }
  }

  return {
    directSousActionByOrigineId: freezeDirectIndex(directSousActionByOrigineId),
    mesureByOrigineId: freezeMesureIndex(mesureByOrigineId),
  };
};

export const resolveCiblesTeDepuisOrigine = (input: {
  sourceActionId: string;
  indexes: CorrespondanceOrigineCibleIndexes;
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>;
  teScoreMap: Map<string, ActionScore>;
}): readonly string[] => {
  const { sourceActionId, indexes, hierarchiesByReferentielId, teScoreMap } =
    input;

  if (isSourceSousMesure(sourceActionId, hierarchiesByReferentielId)) {
    const directSousActions = resolveConcernedTeActionIds(
      indexes.directSousActionByOrigineId.get(sourceActionId),
      teScoreMap
    );

    if (directSousActions.length > 0) {
      return directSousActions;
    }

    const referentielId = getReferentielIdFromActionId(sourceActionId);
    const mesureOrigineId = resolveMesureOrigineId(
      { referentielId, actionId: sourceActionId },
      hierarchiesByReferentielId
    );

    const mesureFromSource = resolveConcernedMesureTeActionIds(
      indexes.mesureByOrigineId.get(sourceActionId),
      teScoreMap
    );

    if (mesureFromSource.length > 0) {
      return mesureFromSource;
    }

    return resolveConcernedMesureTeActionIds(
      indexes.mesureByOrigineId.get(mesureOrigineId),
      teScoreMap
    );
  }

  return resolveConcernedMesureTeActionIds(
    indexes.mesureByOrigineId.get(sourceActionId),
    teScoreMap
  );
};
