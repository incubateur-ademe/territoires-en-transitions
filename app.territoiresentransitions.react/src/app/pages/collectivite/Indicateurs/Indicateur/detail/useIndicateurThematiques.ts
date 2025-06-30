import { Indicateurs } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { TIndicateurDefinition } from '@/app/app/pages/collectivite/Indicateurs/types';
import { Thematique } from '@/domain/shared';
import { useMutation, useQuery, useQueryClient } from 'react-query';

/** Met à jour les thématiques d'un indicateur personnalisé */
export const useUpsertIndicateurThematiques = ({
  id: indicateurId,
  estPerso,
}: Pick<TIndicateurDefinition, 'id' | 'estPerso'>) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  return useMutation({
    mutationKey: 'upsert_indicateur_personnalise_thematique',
    mutationFn: async (thematiques: Thematique[]) => {
      return Indicateurs.save.upsertThematiques(
        supabase,
        indicateurId,
        estPerso,
        thematiques
      );
    },
    onSuccess: () => {
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries([
        'indicateur_thematiques',
        collectivite_id,
        indicateurId,
      ]);
    },
  });
};

/** Charge les thématiques d'un indicateur */
export const useIndicateurThematiques = (indicateurId: number) => {
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery(
    ['indicateur_thematiques', collectivite_id, indicateurId],
    async () => {
      return Indicateurs.fetch.selectIndicateurThematiquesId(
        supabase,
        indicateurId
      );
    }
  );
};
