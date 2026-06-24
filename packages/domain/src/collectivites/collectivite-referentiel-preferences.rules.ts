import type {
  CollectiviteReferentielDisplayId,
  CollectiviteReferentielPreferences,
  ReferentielDisplayMap,
  ReferentielMode,
  ReferentielPreference,
} from './collectivite-preferences.schema';
import { getReferentielDisplayMap } from './collectivite-preferences.schema';

export function preferenceFromDisplay(
  display: boolean,
  visibleMode: Exclude<ReferentielMode, 'archived'>
): ReferentielPreference {
  return display
    ? { display: true, mode: visibleMode }
    : { display: false, mode: 'archived' };
}

/** Mapping display → { display, mode } — PR3 remplacera te.mode par deriveReferentielPreferences. */
export function referentielPreferencesFromDisplayMap(
  display: ReferentielDisplayMap,
  existing?: CollectiviteReferentielPreferences
): CollectiviteReferentielPreferences {
  return {
    cae: preferenceFromDisplay(display.cae, 'write'),
    eci: preferenceFromDisplay(display.eci, 'write'),
    te: {
      ...preferenceFromDisplay(display.te, 'readonly'),
      ...(existing?.te.populatedFromCaeEci && {
        populatedFromCaeEci: existing.te.populatedFromCaeEci,
      }),
    },
  };
}

export function toggleReferentielDisplayPreference(
  referentielId: CollectiviteReferentielDisplayId,
  referentiels: CollectiviteReferentielPreferences
): CollectiviteReferentielPreferences {
  const display = getReferentielDisplayMap(referentiels);
  return referentielPreferencesFromDisplayMap(
    { ...display, [referentielId]: !display[referentielId] },
    referentiels
  );
}
