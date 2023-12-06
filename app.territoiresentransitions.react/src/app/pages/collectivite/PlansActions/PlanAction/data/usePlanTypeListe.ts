import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';

const fetchPlanTypeListe = async () => {
  const query = supabaseClient.from('plan_action_type').select();

  const {error, data} = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/** Renvoie la liste complète des types possibles de plan d'action */
export const usePlanTypeListe = () => {
  const {data} = useQuery(['plan_action_type'], () => fetchPlanTypeListe());

  return data;
};
