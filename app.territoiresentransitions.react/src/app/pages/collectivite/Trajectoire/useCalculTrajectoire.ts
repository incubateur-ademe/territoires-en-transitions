import {useMutation, useQueryClient} from 'react-query';
import {Indicateurs} from '@tet/api';
import {useApiClient} from 'core-logic/api/useApiClient';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {getStatusKey} from './useStatutTrajectoire';

export type ResultatTrajectoire = {
  trajectoire: {
    emissions_ges: IndicateurAvecValeurs[];
    consommations_finales: IndicateurAvecValeurs[];
  };
};

type IndicateurAvecValeurs = {
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
export const useCalculTrajectoire = () => {
  const collectiviteId = useCollectiviteId();
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation(
    getKey(collectiviteId),
    async () =>
      collectiviteId &&
      api.get<ResultatTrajectoire>({
        route: '/trajectoires/snbc',
        params: {collectivite_id: collectiviteId},
      }),
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