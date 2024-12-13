import { useQuery } from 'react-query';

import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { TProfondeurPlan } from './types';

type TFetchedData = {
  plans: TProfondeurPlan[];
};

const fetchPlanActionProfondeur = async (
  collectivite_id: number
): Promise<TFetchedData> => {
  const query = supabaseClient
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
  const collectivite_id = useCollectiviteId();

  const { data } = useQuery(['plan_action_profondeur', collectivite_id], () =>
    fetchPlanActionProfondeur(collectivite_id!)
  );

  return data;
};
