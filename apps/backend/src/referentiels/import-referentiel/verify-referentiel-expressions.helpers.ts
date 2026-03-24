import { ReferentielId } from '@tet/domain/referentiels';
import { VerifyResult } from './verify-referentiel-expressions.types';

export function buildActionId(
  referentielId: ReferentielId,
  identifiant: string
) {
  return `${referentielId}_${identifiant}`;
}

export function combineAllErrors(results: VerifyResult[]): VerifyResult {
  const errors = results.flatMap((r) => (r.success ? [] : r.errors));
  return errors.length ? { success: false, errors } : { success: true };
}
