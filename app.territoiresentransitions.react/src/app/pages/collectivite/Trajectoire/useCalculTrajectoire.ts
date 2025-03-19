import { Indicateurs } from '@/api';
import { trpc } from '@/api/utils/trpc/client';
import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { useEventTracker } from '@/ui';
import { useMutation, useQueryClient } from 'react-query';

export type ResultatTrajectoire = {
  indentifiantsReferentielManquantsDonneesEntree: string[];
  trajectoire: {
    emissionsGes: IndicateurAvecValeurs[];
    consommationsFinales: IndicateurAvecValeurs[];
  };
};

export type IndicateurAvecValeurs = {
  definition: Omit<
    Indicateurs.domain.IndicateurDefinitionPredefini,
    'identifiant'
  > & { identifiantReferentiel: string };
  valeurs: IndicateurValeurGroupee[];
};

type IndicateurValeurGroupee = {
  id: number;
  dateValeur: string;
  objectif: number;
};

export const getKey = (collectiviteId: number | null) => [
  'snbc',
  collectiviteId,
];

/** Déclenche le calcul de la trajectoire */
export const useCalculTrajectoire = (args?: { nouveauCalcul: boolean }) => {
  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite()!;
  const api = useApiClient();
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();
  const trackEvent = useEventTracker('app/trajectoires/snbc');

  return useMutation(
    getKey(collectiviteId),
    async () => {
      if (!collectiviteId) return;
      trackEvent('cta_lancer_calcul', {
        collectiviteId,
        niveauAcces,
        role,
        source: args?.nouveauCalcul ? 'collectivite' : 'open_data',
      });
      return api.get<ResultatTrajectoire>({
        route: '/trajectoires/snbc',
        params: {
          collectiviteId,
          ...(args?.nouveauCalcul
            ? {
                mode: 'maj_spreadsheet_existant',
                forceUtilisationDonneesCollectivite: true,
              }
            : {}),
        },
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
