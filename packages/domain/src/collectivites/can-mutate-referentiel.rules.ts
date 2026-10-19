import {
  collectiviteReferentielPreferenceIds,
  type CollectiviteReferentielPreferenceId,
  type CollectiviteReferentielPreferences,
  type ReferentielMode,
} from './collectivite-preferences.schema';

export function canMutateReferentielData(mode: ReferentielMode): boolean {
  return mode === 'write';
}

/** Référentiels dont la collectivité peut modifier les données (mode write). */
export function listWritableReferentielIds(
  referentiels: CollectiviteReferentielPreferences
): CollectiviteReferentielPreferenceId[] {
  return collectiviteReferentielPreferenceIds.filter((referentielId) =>
    canMutateReferentielData(referentiels[referentielId].mode)
  );
}
