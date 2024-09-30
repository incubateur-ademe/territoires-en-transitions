import {useMutation, useQuery, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Indicateurs, SharedDomain} from '@tet/api';

/** Met à jour les services pilotes d'un indicateur */
export const useUpsertIndicateurServices = (indicateurId: number) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();

  return useMutation({
    mutationKey: 'upsert_indicateur_services',
    mutationFn: async (services: SharedDomain.Tag[]) => {
      if (!collectiviteId) return;
      return Indicateurs.save.upsertServices(
        supabaseClient,
        indicateurId,
        collectiviteId,
        services
      );
    },
    onSuccess: (data, variables) => {
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries([
        'indicateur_services',
        collectiviteId,
        indicateurId,
      ]);
      queryClient.invalidateQueries(['services_pilotes', collectiviteId]);
    },
  });
};

/** Charge les id des services pilotes d'un indicateur */
export const useIndicateurServices = (indicateurId: number) => {
  const collectiviteId = useCollectiviteId();

  return useQuery(
    ['indicateur_services', collectiviteId, indicateurId],
    async () => {
      if (!collectiviteId) return;
      return Indicateurs.fetch.selectIndicateurServicesId(
        supabaseClient,
        indicateurId,
        collectiviteId
      );
    }
  );
};
