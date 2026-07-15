import {
  rollUpActionIdToActionLevel,
  type ActionType,
  type ReferentielId,
} from '@tet/domain/referentiels';

export type OrigineActionRef = {
  referentielId: ReferentielId;
  actionId: string;
};

export const resolveMesureActionIdFromOrigine = (
  origine: OrigineActionRef,
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>
): string => {
  const hierarchie = hierarchiesByReferentielId.get(origine.referentielId);
  if (!hierarchie) {
    return origine.actionId;
  }

  return rollUpActionIdToActionLevel(origine.actionId, hierarchie);
};

export const collectMesureSourceIdsFromOrigines = (
  origines: OrigineActionRef[],
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>
): Set<string> =>
  new Set(
    origines.map((origine) =>
      resolveMesureActionIdFromOrigine(origine, hierarchiesByReferentielId)
    )
  );
