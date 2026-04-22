import { Result } from '@tet/backend/utils/result.type';

export type FicheScopeCheck = { id: number; collectiviteId: number };

export type FicheScopeError =
  | { code: 'FICHE_NOT_FOUND'; missingIds: number[] }
  | { code: 'FICHE_COLLECTIVITE_MISMATCH'; outOfScopeIds: number[] };

export function validateFichesInCollectivite(
  foundFiches: FicheScopeCheck[],
  requestedIds: number[],
  expectedCollectiviteId: number
): Result<undefined, FicheScopeError> {
  if (foundFiches.length !== requestedIds.length) {
    const foundIds = new Set(foundFiches.map((f) => f.id));
    return {
      success: false,
      error: {
        code: 'FICHE_NOT_FOUND',
        missingIds: requestedIds.filter((id) => !foundIds.has(id)),
      },
    };
  }

  const outOfScope = foundFiches
    .filter((f) => f.collectiviteId !== expectedCollectiviteId)
    .map((f) => f.id);

  if (outOfScope.length > 0) {
    return {
      success: false,
      error: {
        code: 'FICHE_COLLECTIVITE_MISMATCH',
        outOfScopeIds: outOfScope,
      },
    };
  }

  return { success: true, data: undefined };
}
