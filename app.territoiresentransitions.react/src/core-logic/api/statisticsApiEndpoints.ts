import {supabaseClient} from 'core-logic/api/supabase';
import {useQuery} from 'react-query';

// Models
export type DailyCount = {
  date: string;
  count: number;
  cumulated_count: number;
};

export type FunctionnalitiesUsageProportion = {
  [key: string]: number | null;
  fiche_action_avg: number | null;
  cae_statuses_avg: number | null;
  eci_statuses_avg: number | null;
  indicateur_personnalise_avg: number | null;
  indicateur_referentiel_avg: number | null;
};

export type CompletenessSlice = {
  bucket: string;
  eci: number;
  cae: number;
};

const useDailyCounts = (
  view:
    | 'stats_rattachements'
    | 'stats_unique_active_collectivite'
    | 'stats_unique_active_users'
) => {
  const {data} = useQuery([view], async () => {
    const {data, error} = await supabaseClient.from(view).select();
    return !data?.length || error ? undefined : data;
  });
  return (data as DailyCount[]) || [];
};

export const useRattachements = () => useDailyCounts('stats_rattachements');
export const useActiveCollectivites = () =>
  useDailyCounts('stats_unique_active_collectivite');
export const useActiveUsers = () => useDailyCounts('stats_unique_active_users');

export const useFunctionnalitiesUsageProportion = () => {
  const {data} = useQuery(
    ['stats_functionnalities_usage_proportion'],
    fetchUsage
  );
  return data || null;
};

const fetchUsage = async () => {
  const {data, error} = await supabaseClient
    .from('stats_functionnalities_usage_proportion')
    .select();

  return !data?.length || error ? null : data[0];
};

export const useCompletenessSlices = () => {
  const {data} = useQuery(['stats_tranche_completude'], fetchCompletness);
  return data || [];
};

const fetchCompletness = async () => {
  const {data, error} = await supabaseClient
    .from('stats_tranche_completude')
    .select();

  return !data || error ? [] : (data as CompletenessSlice[]);
};
