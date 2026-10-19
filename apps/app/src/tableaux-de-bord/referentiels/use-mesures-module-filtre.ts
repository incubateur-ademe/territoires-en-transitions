import { getReferentielCollectiviteOptions } from '@/app/app/pages/CollectivitesEngagees/data/filtreOptions';
import { useReferentielTeEnabled } from '@/app/referentiels/use-referentiel-te-enabled';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ListActionsInput, ReferentielId } from '@tet/domain/referentiels';
import {
  listDisplayedReferentielIds,
  resolveMesuresReferentielIds,
} from './mesures-referentiels.filtre';

/**
 * Filtre d'un module de mesures tenant compte des préférences référentiels de
 * la collectivité, et options de référentiels proposées dans son filtre.
 */
export function useMesuresModuleFiltre(filtre: ListActionsInput) {
  const referentielTeEnabled = useReferentielTeEnabled();
  const { referentiels } = useCurrentCollectivite().collectivitePreferences;
  const context = { referentiels, referentielTeEnabled };

  const displayedReferentielIds: ReferentielId[] =
    listDisplayedReferentielIds(context);

  return {
    filtre: {
      ...filtre,
      referentielIds: resolveMesuresReferentielIds(
        filtre.referentielIds,
        context
      ),
    },
    displayedReferentielIds,
    referentielOptions: getReferentielCollectiviteOptions(
      referentielTeEnabled
    ).filter((option) =>
      displayedReferentielIds.includes(option.value as ReferentielId)
    ),
  };
}
