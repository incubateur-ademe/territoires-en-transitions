import { Indicateurs } from '@/api';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { Tag } from '@/backend/collectivites';
import { useMutation, useQuery, useQueryClient } from 'react-query';

/** Met à jour les services pilotes d'un indicateur */
export const useUpsertIndicateurServices = (indicateurId: number) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();

  return useMutation({
    mutationKey: 'upsert_indicateur_services',
    mutationFn: async (services: Tag[]) => {
      if (!collectiviteId) return;
      return Indicateurs.save.upsertServices(
        supabaseClient,
        indicateurId,
        collectiviteId,
        services
      );
    },
    onSuccess: () => {
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
