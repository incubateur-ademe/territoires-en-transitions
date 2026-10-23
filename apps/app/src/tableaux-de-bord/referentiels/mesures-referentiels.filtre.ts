import {
  collectiviteReferentielPreferenceIds,
  CollectiviteReferentielPreferenceId,
  CollectiviteReferentielPreferences,
  listWritableReferentielIds,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';

type ReferentielsContext = {
  referentiels: CollectiviteReferentielPreferences;
};

/** Référentiels affichés pour la collectivité. */
export function listDisplayedReferentielIds({
  referentiels,
}: ReferentielsContext): CollectiviteReferentielPreferenceId[] {
  return collectiviteReferentielPreferenceIds.filter(
    (referentielId) => referentiels[referentielId].display
  );
}

/**
 * Référentiels dont on liste les mesures : la sélection de l'utilisateur limitée
 * aux référentiels affichés ou, à défaut, les référentiels affichés modifiables
 * (CAE et ECI avant la bascule, TE seul après).
 */
export function resolveMesuresReferentielIds(
  selected: ReferentielId[] | undefined,
  context: ReferentielsContext
): CollectiviteReferentielPreferenceId[] {
  const displayed = listDisplayedReferentielIds(context);

  const selectedDisplayed = displayed.filter((id) => selected?.includes(id));
  if (selectedDisplayed.length) {
    return selectedDisplayed;
  }

  const writable = listWritableReferentielIds(context.referentiels);
  const writableDisplayed = displayed.filter((id) => writable.includes(id));
  return writableDisplayed.length ? writableDisplayed : displayed;
}
