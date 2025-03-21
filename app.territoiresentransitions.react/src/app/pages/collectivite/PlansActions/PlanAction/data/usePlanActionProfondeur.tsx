import { useQuery } from 'react-query';

import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { TProfondeurPlan } from './types';

type TFetchedData = {
  plans: TProfondeurPlan[];
};

const fetchPlanActionProfondeur = async (
  supabase: DBClient,
  collectivite_id: number
): Promise<TFetchedData> => {
  const query = supabase
    .from('plan_action_profondeur')
    .select()
    .eq('collectivite_id', collectivite_id);

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return { plans: (data as TProfondeurPlan[]) || [] };
};

/** Récupère les plans d'une collectivité avec leurs sous-axe.
 * Ne contient pas de fiche.
 */
export const usePlanActionProfondeur = () => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  const { data } = useQuery(['plan_action_profondeur', collectiviteId], () =>
    fetchPlanActionProfondeur(supabase, collectiviteId!)
  );

  return data;
};
