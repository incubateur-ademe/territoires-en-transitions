import { Indicateurs } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useUpdateIndicateurDefinition } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useUpdateIndicateurDefinition';
import { Tag } from '@/domain/collectivites';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Met à jour les services pilotes d'un indicateur */
export const useUpsertIndicateurServices = (indicateur: Indicateurs.domain.IndicateurDefinitionUpdate) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();
  const { mutate: updateDefinition } = useUpdateIndicateurDefinition();

  return useMutation({
    mutationKey: ['upsert_indicateur_services'],
    mutationFn: async (services: Tag[]) => {
      if (!collectiviteId) return;
      return Indicateurs.save.upsertServices(
        supabase,
        indicateur.id,
        collectiviteId,
        services
      );
    },
    onSuccess: async () => {
      // Met à jour l'indicateur pour modifier le modifiedBy
      updateDefinition(indicateur);
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries({
        queryKey: ['indicateur_services', collectiviteId, indicateur.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['services_pilotes', collectiviteId],
      });
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
