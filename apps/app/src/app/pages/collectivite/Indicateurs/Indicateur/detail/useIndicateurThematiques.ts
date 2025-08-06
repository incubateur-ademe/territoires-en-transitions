import { Indicateurs } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useUpdateIndicateurDefinition } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useUpdateIndicateurDefinition';
import { Thematique } from '@/domain/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Met à jour les thématiques d'un indicateur personnalisé */
export const useUpsertIndicateurThematiques = (
  indicateur: Indicateurs.domain.IndicateurDefinitionUpdate,
  estPerso: boolean,
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();
  const { mutate: updateDefinition } = useUpdateIndicateurDefinition();

  return useMutation({
    mutationKey: ['upsert_indicateur_personnalise_thematique'],
    mutationFn: async (thematiques: Thematique[]) => {
      return Indicateurs.save.upsertThematiques(
        supabase,
        indicateur.id,
        estPerso,
        thematiques
      );
    },
    onSuccess: () => {
      // Met à jour l'indicateur pour modifier le modifiedBy
      updateDefinition(indicateur);
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries({
        queryKey: ['indicateur_thematiques', collectivite_id, indicateur.id],
      });
    },
  });
};

/** Charge les thématiques d'un indicateur */
export const useIndicateurThematiques = (indicateurId: number) => {
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['indicateur_thematiques', collectivite_id, indicateurId],

    queryFn: async () => {
      return Indicateurs.fetch.selectIndicateurThematiquesId(
        supabase,
        indicateurId
      );
    },
  });
};
