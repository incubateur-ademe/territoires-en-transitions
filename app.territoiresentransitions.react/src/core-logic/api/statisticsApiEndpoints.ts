import {supabaseClient} from 'core-logic/api/supabase';
import {useEffect, useState} from 'react';

// Models
export type DailyCount = {
  date: string;
  count: number;
  cumulated_count: number;
};

export type FunctionnalitiesUsageProportion = {
  [key: string]: number;
  fiche_action_avg: number;
  eci_referentiel_avg: number;
  cae_referentiel_avg: number;
  indicateur_personnalise_avg: number;
  inficateur_referentiel_avg: number;
};

export type CompletenessSlice = {
  bucket: string;
  eci: number;
  cae: number;
};

const useDailyCounts = (view: string) => {
  const [data, setData] = useState<DailyCount[] | null>(null);

  useEffect(() => {
    if (!data) {
      supabaseClient
        .from(view)
        .select()
        .then(result => setData(result.data));
    }
  }, [view, data]);

  return data;
};

export const useRattachements = () => useDailyCounts('stats_rattachements');
export const useActiveCollectivites = () =>
  useDailyCounts('stats_unique_active_collectivite');
export const useActiveUsers = () => useDailyCounts('stats_unique_active_users');

export const useFunctionnalitiesUsageProportion = () => {
  const [data, setData] = useState<FunctionnalitiesUsageProportion | null>(
    null
  );

  useEffect(() => {
    if (!data) {
      supabaseClient
        .from('stats_functionnalities_usage_proportion')
        .select()
        .then(result => {
          if (result.data?.length === 1) {
            setData(result.data[0]);
          }
        });
    }
  }, [data]);

  return data;
};

export const useCompletenessSlices = () => {
  const [data, setData] = useState<CompletenessSlice[] | null>(null);

  useEffect(() => {
    if (!data) {
      supabaseClient
        .from('stats_tranche_completude')
        .select()
        .then(result => setData(result.data));
    }
  }, [data]);

  return data;
};
