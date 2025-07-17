import { Indicateurs } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { Tag } from '@/domain/collectivites';
import { useMutation, useQuery, useQueryClient } from 'react-query';

/** Met à jour les services pilotes d'un indicateur */
export const useUpsertIndicateurServices = (indicateurId: number) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  return useMutation({
    mutationKey: 'upsert_indicateur_services',
    mutationFn: async (services: Tag[]) => {
      if (!collectiviteId) return;
      return Indicateurs.save.upsertServices(
        supabase,
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
  const supabase = useSupabase();

  return useQuery(
    ['indicateur_services', collectiviteId, indicateurId],
    async () => {
      if (!collectiviteId) return;
      return Indicateurs.fetch.selectIndicateurServicesId(
        supabase,
        indicateurId,
        collectiviteId
      );
    }
  );
};
