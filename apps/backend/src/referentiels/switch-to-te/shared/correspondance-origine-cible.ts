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

/**
 * Filtre d'activation appliqué aux cibles TE candidates : `null` pour les
 * retenir toutes, y compris celles désactivées le jour de la bascule.
 */
type CibleFilter = ((teActionId: string) => boolean) | null;

const resolveTeActionIds = (
  candidates: readonly string[] | undefined,
  filter: CibleFilter
): readonly string[] => {
  if (!candidates?.length) {
    return [];
  }

  return (filter ? candidates.filter(filter) : candidates).toSorted();
};

const resolveMesureTeActionIds = (
  mappings: readonly MesureOrigineMapping[] | undefined,
  filter: CibleFilter
): readonly string[] => {
  if (!mappings?.length) {
    return [];
  }

  const retainedMappings = filter
    ? mappings.filter((mapping) => filter(mapping.teActionId))
    : mappings;

  if (retainedMappings.length === 0) {
    return [];
  }

  const directMappings = retainedMappings.filter(
    (mapping) => mapping.kind === 'direct'
  );
  const candidateMappings =
    directMappings.length > 0 ? directMappings : retainedMappings;

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

/**
 * Indexe toutes les cibles TE, y compris celles désactivées le jour de la
 * bascule : le filtre d'activation est appliqué à la résolution.
 */
export const buildCorrespondanceIndexes = (input: {
  sousActionsEtTaches: ActionCible[];
  mesures: ActionCible[];
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>;
}): CorrespondanceOrigineCibleIndexes => {
  const directSousActionByOrigineId = new Map<string, Set<string>>();
  const mesureByOrigineId = new Map<string, Map<string, MesureMappingKind>>();

  for (const cible of input.sousActionsEtTaches) {
    for (const origine of cible.originesConcernees) {
      registerDirectSousActionMapping(
        directSousActionByOrigineId,
        origine.actionId,
        cible.actionId
      );
    }
  }

  for (const cible of input.mesures) {
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

const resolveCibles = (
  sourceActionId: string,
  indexes: CorrespondanceOrigineCibleIndexes,
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>,
  filter: CibleFilter
): readonly string[] => {
  if (isSourceSousMesure(sourceActionId, hierarchiesByReferentielId)) {
    const directSousActions = resolveTeActionIds(
      indexes.directSousActionByOrigineId.get(sourceActionId),
      filter
    );

    if (directSousActions.length > 0) {
      return directSousActions;
    }

    const referentielId = getReferentielIdFromActionId(sourceActionId);
    const mesureOrigineId = resolveMesureOrigineId(
      { referentielId, actionId: sourceActionId },
      hierarchiesByReferentielId
    );

    const mesureFromSource = resolveMesureTeActionIds(
      indexes.mesureByOrigineId.get(sourceActionId),
      filter
    );

    if (mesureFromSource.length > 0) {
      return mesureFromSource;
    }

    return resolveMesureTeActionIds(
      indexes.mesureByOrigineId.get(mesureOrigineId),
      filter
    );
  }

  return resolveMesureTeActionIds(
    indexes.mesureByOrigineId.get(sourceActionId),
    filter
  );
};

/**
 * Cibles TE d'une action source : union de deux résolutions.
 *
 * 1. Limitée aux cibles actives le jour de la bascule.
 * 2. Sans filtre d'activation, pour reprendre aussi le lien sur les cibles
 *    désactivées, qui peuvent s'activer plus tard (réponse à une question de
 *    personnalisation).
 *
 * La seconde ne remplace pas la première : une sous-mesure TE désactivée dont
 * la mesure parente est active ferait sinon perdre le lien vers la mesure
 * parente, seule visible à la bascule.
 */
export const resolveCiblesTeDepuisOrigine = (input: {
  sourceActionId: string;
  indexes: CorrespondanceOrigineCibleIndexes;
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>;
  teScoreMap: Map<string, ActionScore>;
}): readonly string[] => {
  const { sourceActionId, indexes, hierarchiesByReferentielId, teScoreMap } =
    input;

  const ciblesActives = resolveCibles(
    sourceActionId,
    indexes,
    hierarchiesByReferentielId,
    (teActionId) => isCibleConcernee(teScoreMap, teActionId)
  );
  const ciblesToutes = resolveCibles(
    sourceActionId,
    indexes,
    hierarchiesByReferentielId,
    null
  );

  return [...new Set([...ciblesActives, ...ciblesToutes])].toSorted();
};
