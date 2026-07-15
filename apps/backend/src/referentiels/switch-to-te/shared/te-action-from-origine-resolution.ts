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

export type TeActionIndexes = {
  /** origine source → sous-action TE (correspondance directe 1→1 sur sousActionsEtTaches) */
  directSousActionByOrigineId: ReadonlyMap<string, string>;
  /** origine source → mesure TE (agrégation mesure + descendants) */
  mesureByOrigineId: ReadonlyMap<string, string>;
};

const SOUS_MESURE_LEVEL_THRESHOLD = 4;

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
  const directSousActionByOrigineId = new Map<string, string>();
  const mesureByOrigineId = new Map<string, string>();

  for (const cible of input.sousActionsEtTaches) {
    if (!cible.concernee) {
      continue;
    }

    for (const origine of cible.originesConcernees) {
      if (!directSousActionByOrigineId.has(origine.actionId)) {
        directSousActionByOrigineId.set(origine.actionId, cible.actionId);
      }
    }
  }

  for (const cible of input.mesures) {
    if (!cible.concernee) {
      continue;
    }

    for (const origine of cible.originesConcernees) {
      if (!mesureByOrigineId.has(origine.actionId)) {
        mesureByOrigineId.set(origine.actionId, cible.actionId);
      }

      const mesureSourceId = resolveMesureActionIdFromOrigine(
        {
          referentielId: origine.referentielId as ReferentielId,
          actionId: origine.actionId,
        },
        input.hierarchiesByReferentielId
      );
      if (!mesureByOrigineId.has(mesureSourceId)) {
        mesureByOrigineId.set(mesureSourceId, cible.actionId);
      }
    }
  }

  return { directSousActionByOrigineId, mesureByOrigineId };
};

export const resolveTeActionIdForSourceLink = (input: {
  sourceActionId: string;
  indexes: TeActionIndexes;
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>;
  teScoreMap: Map<string, ActionScore>;
}): string | null => {
  const { sourceActionId, indexes, hierarchiesByReferentielId, teScoreMap } =
    input;

  let teId: string | undefined;

  if (isSourceSousMesure(sourceActionId, hierarchiesByReferentielId)) {
    const referentielId = getReferentielIdFromActionId(sourceActionId);
    const mesureSourceId = resolveMesureActionIdFromOrigine(
      { referentielId, actionId: sourceActionId },
      hierarchiesByReferentielId
    );

    teId =
      indexes.directSousActionByOrigineId.get(sourceActionId) ??
      indexes.mesureByOrigineId.get(sourceActionId) ??
      indexes.mesureByOrigineId.get(mesureSourceId);
  } else {
    teId = indexes.mesureByOrigineId.get(sourceActionId);
  }

  if (!teId || !isCibleConcernee(teScoreMap, teId)) {
    return null;
  }

  return teId;
};
