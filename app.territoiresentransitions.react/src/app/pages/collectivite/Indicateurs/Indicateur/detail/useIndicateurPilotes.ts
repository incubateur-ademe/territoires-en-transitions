import { Indicateurs } from '@/api';
import { Personne } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Met à jour les personnes pilotes d'un indicateur */
export const useUpsertIndicateurPilote = (indicateurId: number) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  return useMutation({
    mutationKey: ['upsert_indicateur_pilotes'],
    mutationFn: async (pilotes: Personne[]) => {
      if (!collectivite_id) return;
      return Indicateurs.save.upsertPilotes(
        supabase,
        indicateurId,
        collectivite_id,
        pilotes
      );
    },
    onSuccess: (data, variables) => {
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries({
        queryKey: ['indicateur_pilotes', collectivite_id, indicateurId],
      });
      queryClient.invalidateQueries({
        queryKey: ['personnes', collectivite_id],
      });
    },
  });
};

/** Charge les personnes pilotes d'un indicateur */
export const useIndicateurPilotes = (indicateurId: number) => {
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['indicateur_pilotes', collectivite_id, indicateurId],

    queryFn: async () => {
      if (!collectivite_id) return;
      return Indicateurs.fetch.selectIndicateurPilotes(
        supabase,
        indicateurId,
        collectivite_id
      );
    },
  });
};
