import { useMemo } from 'react';
import {
  toSousIndicateursChartState,
  type SousIndicateursChartState,
} from '../sous-indicateurs-chart-state.rules';
import {
  useSousIndicateursQueries,
  type SousIndicateursQueryOptions,
} from './use-sous-indicateurs-queries';

export const useSousIndicateursChart = (
  indicateurId: number,
  options: SousIndicateursQueryOptions
): SousIndicateursChartState => {
  const { collectiviteId, nodes, valeurs, totals } = useSousIndicateursQueries(
    indicateurId,
    options
  );

  return useMemo(
    () =>
      toSousIndicateursChartState({
        indicateurId,
        collectiviteId,
        nodes,
        valeurs,
        totals,
      }),
    [indicateurId, collectiviteId, nodes, valeurs, totals]
  );
};
