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

  if (data) {
    if (!data.pilotes && !data.priorites && !data.referents && !data.statuts)
      return null;

    const sortedData = {
      ...data,
      pilotes: data.pilotes ? sortByValue(data.pilotes) : [],
      priorites: data.priorites ? sortByPriority(data.priorites) : [],
      referents: data.referents ? sortByValue(data.referents) : [],
      statuts: data.statuts ? sortByStatus(data.statuts) : [],
    };

    return sortedData;
  } else return null;
};

const sortByValue = (
  data: {id: string; value: number}[]
): {id: string; value: number}[] => {
  const sortedData = data.filter(d => d.id !== 'NC');
  sortedData.sort((a, b) => b.value - a.value);

  const ncItem = data.find(d => d.id === 'NC');
  if (ncItem) sortedData.push(ncItem);

  return sortedData;
};

const sortByPriority = (
  data: {id: string; value: number}[]
): {id: string; value: number}[] => {
  const rank = {Bas: 1, Moyen: 2, Élevé: 3, NC: 4};
  // @ts-ignore
  return data.sort((a, b) => rank[a.id] - rank[b.id]);
};

const sortByStatus = (
  data: {id: string; value: number}[]
): {id: string; value: number}[] => {
  const rank = {
    'À venir': 1,
    'En cours': 2,
    Réalisé: 3,
    'En pause': 4,
    Abandonné: 5,
    NC: 6,
  };
  // @ts-ignore
  return data.sort((a, b) => rank[a.id] - rank[b.id]);
};
