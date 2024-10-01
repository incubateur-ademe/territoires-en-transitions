import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {
  ActionImpact,
  ActionImpactThematique,
  ActionImpactTypologie,
} from '@tet/api';

type ActionImpactDetail = ActionImpact & {
  thematiques: ActionImpactThematique[];
  typologie: ActionImpactTypologie | null;
};

/**
 * Charge le détail d'une action à impact
 */
export const useActionImpact = (actionImpactId: number) =>
  useQuery(['action_impact', actionImpactId], async () => {
    const {data, error} = await supabaseClient
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
      .returns<ActionImpactDetail[]>();

    if (error) throw new Error(error.message);

    return data?.[0];
  });
