import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';

export type TPlanActionTableauDeBord = {
  collectivite_id: number;
  plan_id: number;
  pilotes: {id: string; value: number}[];
  priorites: {id: string; value: number}[];
  referents: {id: string; value: number}[];
  statuts: {id: string; value: number}[];
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

/**
 * Hook permettant la récupération des données pour la synthèse des plans d'action (graphes)
 *
 * @param collectivite_id - (number) id de la collectivité à récupérer
 * @param plan_id - (number | null) id du plan d'action à récupérer
 * @param sans_plan - (boolean | null) données avec ou sans plan d'action
 */

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
