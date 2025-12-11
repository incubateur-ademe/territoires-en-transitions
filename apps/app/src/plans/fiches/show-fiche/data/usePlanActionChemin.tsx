import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@tet/api';

/**
 * Récupère les parents d'un axe dans un plan.
 * Renvoi l'id du plan et l'id de la collectivité
 * ainsi que le chemin jusqu'à l'axe donné.
 */
export const usePlanActionChemin = (axe_id?: number) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['plan_action_chemin', axe_id],

    queryFn: async () => {
      if (axe_id === undefined) {
        return null;
      }
      const { data } = await supabase
        .from('plan_action_chemin')
        .select()
        .eq('axe_id', axe_id);
      return data && data[0];
    },
    enabled: axe_id !== undefined,
  });
};

export const useFicheActionChemins = (axesIds: number[]) => {
  const supabase = useSupabase();

  const { data, isLoading } = useQuery({
    queryKey: ['fiche_action_chemins', axesIds],

    queryFn: async () => {
      return await supabase
        .from('plan_action_chemin')
        .select()
        .in('axe_id', axesIds);
    },
  });

  return { data: data?.data, isLoading };
};
