import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';

export type TPlanActionTableauDeBord = {
  collectivite_id: number;
  plan_id: number;
  pilotes: {label: string; value: number}[];
  priorites: {label: string; value: number}[];
  referents: {label: string; value: number}[];
  statuts: {label: string; value: number}[];
};

const fetchDashboardData = async (
  collectivite_id: number,
  plan_id: number | null,
  sans_plan: boolean | null
): Promise<TPlanActionTableauDeBord | null> => {
  const {error, data} = await supabaseClient.rpc(
    'plan_action_tableau_de_bord',
    {
      collectivite_id,
      // @ts-ignore
      plan_id,
      // @ts-ignore
      sans_plan,
    }
  );

  if (error || !data) return null;

  return data as unknown as TPlanActionTableauDeBord;
};

export const usePlanActionTableauDeBord = (
  collectivite_id: number,
  plan_id: number | null,
  sans_plan: boolean | null
): TPlanActionTableauDeBord | null => {
  const {data} = useQuery(
    ['plan_action_tableau_de_bord', collectivite_id, plan_id, sans_plan],
    () => fetchDashboardData(collectivite_id, plan_id, sans_plan)
  );

  return data ?? null;
};
