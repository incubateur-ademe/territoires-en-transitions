import { ActionImpactDetails } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from '@tanstack/react-query';

/**
 * Charge le détail d'une action à impact
 */
export const useActionImpact = (actionImpactId: number) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['action_impact', actionImpactId],

    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_impact')
        .select(
          `titre,
        typologie:action_impact_typologie(*),
        thematiques:action_impact_thematique(...thematique(id,nom)),
        budget:action_impact_fourchette_budgetaire(*),
        miseEnOeuvre:action_impact_temps_de_mise_en_oeuvre(*),
        ressources:ressources_externes,
        rex,
        subventions:subventions_mobilisables
        `
        )
        .eq('id', actionImpactId)
        .returns<ActionImpactDetails[]>();

      if (error) throw new Error(error.message);

      return data?.[0];
    },
  });
};
