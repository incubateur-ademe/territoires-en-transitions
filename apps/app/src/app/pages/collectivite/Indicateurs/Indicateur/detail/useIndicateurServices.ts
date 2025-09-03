import { Indicateurs } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { Tag } from '@/domain/collectivites';
import { useNPSSurveyManager } from '@/ui/components/tracking/use-nps-survey-manager';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Met à jour les services pilotes d'un indicateur */
export const useUpsertIndicateurServices = (indicateurId: number) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();
  const { trackUpdateOperation } = useNPSSurveyManager();
  return useMutation({
    mutationKey: ['upsert_indicateur_services'],
    mutationFn: async (services: Tag[]) => {
      return Indicateurs.save.upsertServices(
        supabase,
        indicateurId,
        collectiviteId,
        services
      );
    },
    onSuccess: () => {
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries({
        queryKey: ['indicateur_services', collectiviteId, indicateurId],
      });
      queryClient.invalidateQueries({
        queryKey: ['services_pilotes', collectiviteId],
      });
      trackUpdateOperation('indicateurs');
    },
  });
};

/** Charge les id des services pilotes d'un indicateur */
export const useIndicateurServices = (indicateurId: number) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['indicateur_services', collectiviteId, indicateurId],

    queryFn: async () => {
      if (!collectiviteId) return;
      return Indicateurs.fetch.selectIndicateurServicesId(
        supabase,
        indicateurId,
        collectiviteId
      );
    },
  });
};
