import { PermissionOperation } from './permission-operation.enum.schema';

/** Referentiel ops that remain allowed when mode is readonly/archived. */
const referentielReadOperationsSet = new Set<PermissionOperation>([
  'referentiels.read',
  'referentiels.read_confidentiel',
  'referentiels.discussions.read',
]);

export function isReferentielReadOperation(
  operation: PermissionOperation
): boolean {
  return referentielReadOperationsSet.has(operation);
}

/** Referentiel ops blocked when mode ≠ write (includes discussions.mutate). */
export function isReferentielMutationOperation(
  operation: PermissionOperation
): boolean {
  return (
    operation.startsWith('referentiels.') &&
    !isReferentielReadOperation(operation)
  );
}
