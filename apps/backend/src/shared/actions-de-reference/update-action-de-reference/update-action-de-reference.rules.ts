import { failure, type Result, success } from '@tet/backend/utils/result.type';
import { uniq } from 'es-toolkit';
import { type FicheParent } from '../action-de-reference-fiche.repository';
import {
  ActionsDeReferenceErrorEnum,
  type LinkableFicheIdsError,
} from '../actions-de-reference.errors';

export const toLinkableFicheIds = ({
  requestedFicheIds,
  existingFiches,
}: {
  readonly requestedFicheIds: readonly number[];
  readonly existingFiches: readonly FicheParent[];
}): Result<number[], LinkableFicheIdsError> => {
  const uniqueFicheIds = uniq([...requestedFicheIds]);
  const parentIdByFicheId = new Map(
    existingFiches.map(({ id, parentId }) => [id, parentId])
  );

  const hasUnknownFiche = uniqueFicheIds.some(
    (ficheId) => !parentIdByFicheId.has(ficheId)
  );
  if (hasUnknownFiche) {
    return failure(ActionsDeReferenceErrorEnum.FICHE_NOT_FOUND);
  }

  const hasSousAction = uniqueFicheIds.some(
    (ficheId) => parentIdByFicheId.get(ficheId) !== null
  );
  if (hasSousAction) {
    return failure(ActionsDeReferenceErrorEnum.FICHE_IS_SOUS_ACTION);
  }

  return success(uniqueFicheIds);
};
