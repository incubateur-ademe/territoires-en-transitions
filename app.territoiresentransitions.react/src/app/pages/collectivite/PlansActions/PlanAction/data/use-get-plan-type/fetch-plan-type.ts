import { DBClient } from '@/api';
import { TPlanType } from '@/app/types/alias';

export const fetchPlanType = async (
  supabase: DBClient,
  {
    collectiviteId,
    planId,
  }: {
    collectiviteId: number;
    planId: number;
  }
): Promise<TPlanType | null> => {
  const query = supabase
    .from('axe')
    .select('type:plan_action_type')
    .eq('collectivite_id', collectiviteId)
    .eq('id', planId)
    .returns<{ type: TPlanType }[]>()
    .limit(1);

  const { error, data } = await query;
  if (error || !data?.[0]) {
    return null;
  }
  return data[0].type ?? null;
};
