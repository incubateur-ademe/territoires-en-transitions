import {
  ActionTypeEnum,
  getActionTypeFromActionId,
  getLevelFromActionId,
  getReferentielIdFromActionId,
  type ActionScore,
  type ActionType,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { type ActionCible } from './action-cible';
import { isCibleConcernee } from './origine.rules';
import { resolveMesureActionIdFromOrigine } from './resolve-mesures-sources';

type MesureMappingKind = 'direct' | 'rollup';

type MesureOrigineMapping = {
  teActionId: string;
  kind: MesureMappingKind;
};

export type TeActionIndexes = {
  /** origine source → sous-actions TE candidates (correspondance directe 1→1 sur sousActionsEtTaches) */
  directSousActionByOrigineId: ReadonlyMap<string, readonly string[]>;
  /** origine source → mesures TE candidates (direct ou agrégation rollup) */
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

const resolveUniqueConcernedTeActionId = (
  candidates: readonly string[] | undefined,
  teScoreMap: Map<string, ActionScore>,
  origineKey: string,
  indexLabel: 'directSousActionByOrigineId' | 'mesureByOrigineId'
): string | null => {
  if (!candidates?.length) {
    return null;
  }

  const concernedCandidates = candidates.filter((teActionId) =>
    isCibleConcernee(teScoreMap, teActionId)
  );

  if (concernedCandidates.length > 1) {
    throw new Error(
      `Collision dans ${indexLabel} : l'origine "${origineKey}" correspond à plusieurs cibles TE concernées (${concernedCandidates.join(', ')})`
    );
  }

  return concernedCandidates[0] ?? null;
};

const resolveMesureTeActionId = (
  mappings: readonly MesureOrigineMapping[] | undefined,
  teScoreMap: Map<string, ActionScore>,
  origineKey: string
): string | null => {
  if (!mappings?.length) {
    return null;
  }

  const concernedMappings = mappings.filter((mapping) =>
    isCibleConcernee(teScoreMap, mapping.teActionId)
  );

  if (concernedMappings.length === 0) {
    return null;
  }

  const directMappings = concernedMappings.filter(
    (mapping) => mapping.kind === 'direct'
  );

  if (directMappings.length > 1) {
    throw new Error(
      `Collision dans mesureByOrigineId : l'origine "${origineKey}" correspond à plusieurs mesures TE concernées en correspondance directe (${directMappings.map((mapping) => mapping.teActionId).join(', ')})`
    );
  }

  if (directMappings.length === 1) {
    return directMappings[0].teActionId;
  }

  const rollupCandidates = concernedMappings
    .map((mapping) => mapping.teActionId)
    .toSorted();

  return rollupCandidates[0] ?? null;
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

export const buildTeActionIndexesFromCibles = (input: {
  sousActionsEtTaches: ActionCible[];
  mesures: ActionCible[];
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>;
}): TeActionIndexes => {
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

      const mesureSourceId = resolveMesureActionIdFromOrigine(
        {
          referentielId: origine.referentielId,
          actionId: origine.actionId,
        },
        input.hierarchiesByReferentielId
      );

      if (mesureSourceId !== origine.actionId) {
        registerMesureMapping(
          mesureByOrigineId,
          mesureSourceId,
          cible.actionId,
          'rollup'
        );
      }
    }
  }

  return {
    directSousActionByOrigineId: freezeDirectIndex(directSousActionByOrigineId),
    mesureByOrigineId: freezeMesureIndex(mesureByOrigineId),
  };
};

export const resolveTeActionIdForSourceLink = (input: {
  sourceActionId: string;
  indexes: TeActionIndexes;
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>;
  teScoreMap: Map<string, ActionScore>;
}): string | null => {
  const { sourceActionId, indexes, hierarchiesByReferentielId, teScoreMap } =
    input;

  let teId: string | null = null;

  if (isSourceSousMesure(sourceActionId, hierarchiesByReferentielId)) {
    const referentielId = getReferentielIdFromActionId(sourceActionId);
    const mesureSourceId = resolveMesureActionIdFromOrigine(
      { referentielId, actionId: sourceActionId },
      hierarchiesByReferentielId
    );

    teId =
      resolveUniqueConcernedTeActionId(
        indexes.directSousActionByOrigineId.get(sourceActionId),
        teScoreMap,
        sourceActionId,
        'directSousActionByOrigineId'
      ) ??
      resolveMesureTeActionId(
        indexes.mesureByOrigineId.get(sourceActionId),
        teScoreMap,
        sourceActionId
      ) ??
      resolveMesureTeActionId(
        indexes.mesureByOrigineId.get(mesureSourceId),
        teScoreMap,
        mesureSourceId
      );
  } else {
    teId = resolveMesureTeActionId(
      indexes.mesureByOrigineId.get(sourceActionId),
      teScoreMap,
      sourceActionId
    );
  }

  if (!teId || !isCibleConcernee(teScoreMap, teId)) {
    return null;
  }

  return teId;
};
