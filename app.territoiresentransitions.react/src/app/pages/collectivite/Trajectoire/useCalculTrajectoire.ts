import {useMutation, useQueryClient} from 'react-query';
import {Indicateurs} from '@tet/api';
import {useApiClient} from 'core-logic/api/useApiClient';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {getStatusKey} from './useStatutTrajectoire';
import {useEventTracker} from '@tet/ui';

export type ResultatTrajectoire = {
  indentifiants_referentiel_manquants_donnees_entree: string[];
  trajectoire: {
    emissions_ges: IndicateurAvecValeurs[];
    consommations_finales: IndicateurAvecValeurs[];
  };
};

export type IndicateurAvecValeurs = {
  definition: Omit<
    Indicateurs.domain.IndicateurDefinitionPredefini,
    'identifiant'
  > & {identifiant_referentiel: string};
  valeurs: IndicateurValeurGroupee[];
};

type IndicateurValeurGroupee = {
  id: number;
  date_valeur: string;
  objectif: number;
};

export const getKey = (collectiviteId: number | null) => [
  'snbc',
  collectiviteId,
];

/** Déclenche le calcul de la trajectoire */
export const useCalculTrajectoire = (args?: {nouveauCalcul: boolean}) => {
  const collectiviteId = useCollectiviteId();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const trackEvent = useEventTracker('app/trajectoires/snbc');

  return useMutation(
    getKey(collectiviteId),
    async () => {
      if (!collectiviteId) return;
      trackEvent('cta_lancer_calcul', {
        collectivite_id: collectiviteId,
        source: args?.nouveauCalcul ? 'collectivite' : 'open_data',
      });
      return api.get<ResultatTrajectoire>({
        route: '/trajectoires/snbc',
        params: {
          collectivite_id: collectiviteId,
          ...(args?.nouveauCalcul
            ? {
                mode: 'maj_spreadsheet_existant',
                force_utilisation_donnees_collectivite: true,
              }
            : {}),
        },
      });
    },
    {
      retry: false,
      onSuccess: data => {
        // met à jour le cache
        queryClient.setQueryData(getKey(collectiviteId), data);
        queryClient.invalidateQueries(getStatusKey(collectiviteId));
      },
    }
  );
};
