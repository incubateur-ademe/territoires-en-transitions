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

export type DeriveReferentielPreferencesInput = {
  caeEngaged: boolean;
  eciEngaged: boolean;
};

export function deriveReferentielPreferences(
  input: DeriveReferentielPreferencesInput,
  existing?: CollectiviteReferentielPreferences
): CollectiviteReferentielPreferences {
  if (existing?.te.populatedFromCaeEci) {
    return existing;
  }

  const { caeEngaged, eciEngaged } = input;
  const collectiviteEngaged = caeEngaged || eciEngaged;

  if (collectiviteEngaged) {
    return {
      cae: preferenceFromDisplay(caeEngaged, 'write'),
      eci: preferenceFromDisplay(eciEngaged, 'write'),
      te: preferenceFromDisplay(true, 'readonly'),
    };
  }

  return {
    cae: preferenceFromDisplay(false, 'write'),
    eci: preferenceFromDisplay(false, 'write'),
    te: preferenceFromDisplay(true, 'write'),
  };
}

export function referentielPreferencesFromDisplayMap(
  display: ReferentielDisplayMap,
  existing?: CollectiviteReferentielPreferences
): CollectiviteReferentielPreferences {
  const derived = deriveReferentielPreferences(
    { caeEngaged: display.cae, eciEngaged: display.eci },
    existing
  );

  if (existing?.te.populatedFromCaeEci) {
    return derived;
  }

  return {
    ...derived,
    te: preferenceFromDisplay(
      display.te,
      derived.te.mode as Exclude<ReferentielMode, 'archived'>
    ),
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
