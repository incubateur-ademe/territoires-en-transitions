import { useMemo } from 'react';
import {
  toSousIndicateursChartState,
  type SousIndicateursChartState,
} from '../sous-indicateurs-chart-state.rules';
import { useSousIndicateursQueries } from './use-sous-indicateurs-queries';

export const useSousIndicateursChart = (
  indicateurId: number
): SousIndicateursChartState => {
  const { collectiviteId, nodes, valeurs, totals } =
    useSousIndicateursQueries(indicateurId);

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
