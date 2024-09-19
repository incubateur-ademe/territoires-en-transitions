import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {ActionImpact, ActionImpactThematique} from '@tet/api';

type ActionImpactDetail = ActionImpact & {
  thematiques: ActionImpactThematique[];
};

/**
 * Charge le détail d'une action à impact
 */
export const useActionImpact = (actionImpactId: number) =>
  useQuery(['action_impact', actionImpactId], async () => {
    const {data, error} = await supabaseClient
      .from('action_impact')
      .select()
      .eq('id', actionImpactId)
      .returns<ActionImpactDetail[]>();

    if (error) throw new Error(error.message);

    return data?.[0];
  });
