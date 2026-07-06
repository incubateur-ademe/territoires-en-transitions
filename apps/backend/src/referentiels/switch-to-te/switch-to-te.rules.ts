import type { CollectiviteReferentielPreferences } from '@tet/domain/collectivites';

export function canSwitchToTe(
  prefs: CollectiviteReferentielPreferences
): boolean {
  if (prefs.te.populatedFromCaeEci) return false;
  if (prefs.te.mode !== 'readonly') return false;
  // proxy engagement : au moins une source encore en écriture
  return prefs.cae.mode === 'write' || prefs.eci.mode === 'write';
}
