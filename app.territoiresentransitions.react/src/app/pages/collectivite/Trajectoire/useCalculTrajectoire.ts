import { useCurrentCollectivite } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';
import {
  CalculTrajectoireReset,
  IndicateurAvecValeurs,
} from '@/domain/indicateurs';
import { Event, useEventTracker } from '@/ui';
import { useMutation, useQueryClient } from 'react-query';

export type ResultatTrajectoire = {
  indentifiantsReferentielManquantsDonneesEntree: string[];
  trajectoire: {
    emissionsGes: IndicateurAvecValeurs[];
    consommationsFinales: IndicateurAvecValeurs[];
  };
};

export const getKey = (collectiviteId: number | null) => [
  'snbc',
  collectiviteId,
];

/** Déclenche le calcul de la trajectoire */
export const useCalculTrajectoire = (args?: { nouveauCalcul: boolean }) => {
  const { collectiviteId } = useCurrentCollectivite();
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();
  const trackEvent = useEventTracker();

  return useMutation(
    getKey(collectiviteId),
    async () => {
      if (!collectiviteId) return;
      trackEvent(Event.trajectoire.triggerSnbcCalculation, {
        source: args?.nouveauCalcul ? 'collectivite' : 'open_data',
      });

      return utils.indicateurs.trajectoires.snbc.getOrCompute.fetch({
        collectiviteId,
        ...(args?.nouveauCalcul
          ? {
              mode: CalculTrajectoireReset.MAJ_SPREADSHEET_EXISTANT,
              forceUtilisationDonneesCollectivite: true,
            }
          : {}),
      });
    },
    {
      retry: false,
      onSuccess: (data) => {
        // met à jour le cache
        queryClient.setQueryData(getKey(collectiviteId), data);

        utils.indicateurs.valeurs.list.invalidate({ collectiviteId });
        utils.indicateurs.sources.available.invalidate({ collectiviteId });
      },
    }
  );
};
