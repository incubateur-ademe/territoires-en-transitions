import { useMemo } from 'react';
import {
  toSousIndicateursChartState,
  type SousIndicateursChartState,
} from '../sous-indicateurs-chart-state.rules';
import { useSousIndicateursQueries } from './use-sous-indicateurs-queries';

export const useSousIndicateursChart = (
  indicateurId: number,
  isCumul: boolean
): SousIndicateursChartState => {
  const { collectiviteId, nodes, valeurs, totals } =
    useSousIndicateursQueries(indicateurId);

  return useMemo(
    () =>
      toSousIndicateursChartState({
        indicateurId,
        isCumul,
        collectiviteId,
        nodes,
        valeurs,
        totals,
      }),
    [indicateurId, isCumul, collectiviteId, nodes, valeurs, totals]
  );
};
