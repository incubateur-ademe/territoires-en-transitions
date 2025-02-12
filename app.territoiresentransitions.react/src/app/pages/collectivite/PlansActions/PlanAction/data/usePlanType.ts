import { useQuery } from 'react-query';

import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { PlanType } from './types';

const fetchPlanType = async (
  supabase: DBClient,
  {
    collectivite_id,
    planId,
  }: {
    collectivite_id: number;
    planId: number;
  }
) => {
  const query = supabase
    .from('axe')
    .select('type:plan_action_type')
    .eq('collectivite_id', collectivite_id)
    .eq('id', planId)
    .returns<PlanType[]>();

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data[0].type;
};

/** Renvoie le type complet d'un plan d'action */
export const usePlanType = (planId: number) => {
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  const { data } = useQuery(['plan_type', planId], () =>
    fetchPlanType(supabase, { collectivite_id: collectivite_id!, planId })
  );

  return data;
};
