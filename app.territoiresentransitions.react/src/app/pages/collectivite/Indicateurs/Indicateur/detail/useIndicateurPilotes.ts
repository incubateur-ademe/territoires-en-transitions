import { Indicateurs } from '@/api';
import { Personne, useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useMutation, useQuery, useQueryClient } from 'react-query';

/** Met à jour les personnes pilotes d'un indicateur */
export const useUpsertIndicateurPilote = (indicateurId: number) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  return useMutation({
    mutationKey: `upsert_indicateur_pilotes`,
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
      queryClient.invalidateQueries([
        'indicateur_pilotes',
        collectivite_id,
        indicateurId,
      ]);
      queryClient.invalidateQueries(['personnes', collectivite_id]);
    },
  });
};

/** Charge les personnes pilotes d'un indicateur */
export const useIndicateurPilotes = (indicateurId: number) => {
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery(
    ['indicateur_pilotes', collectivite_id, indicateurId],
    async () => {
      if (!collectivite_id) return;
      return Indicateurs.fetch.selectIndicateurPilotes(
        supabase,
        indicateurId,
        collectivite_id
      );
    }
  );
};
