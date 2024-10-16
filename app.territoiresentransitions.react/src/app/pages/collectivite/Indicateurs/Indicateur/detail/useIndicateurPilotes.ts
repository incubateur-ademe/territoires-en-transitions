import { useMutation, useQuery, useQueryClient } from 'react-query';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { Indicateurs } from '@tet/api';
import { Personne } from '@tet/api/collectivites';

/** Met à jour les personnes pilotes d'un indicateur */
export const useUpsertIndicateurPilote = (indicateurId: number) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  return useMutation({
    mutationKey: `upsert_indicateur_pilotes`,
    mutationFn: async (pilotes: Personne[]) => {
      if (!collectivite_id) return;
      return Indicateurs.save.upsertPilotes(
        supabaseClient,
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

  return useQuery(
    ['indicateur_pilotes', collectivite_id, indicateurId],
    async () => {
      if (!collectivite_id) return;
      return Indicateurs.fetch.selectIndicateurPilotes(
        supabaseClient,
        indicateurId,
        collectivite_id
      );
    }
  );
};
