import { useMemo } from 'react';
import {
  toSousIndicateursTableState,
  type SousIndicateursTableState,
} from '../sous-indicateurs-table-state.rules';
import {
  useSousIndicateursQueries,
  type SousIndicateursQueryOptions,
} from './use-sous-indicateurs-queries';

export const useSousIndicateursTable = (
  indicateurId: number,
  options: SousIndicateursQueryOptions
): SousIndicateursTableState => {
  const { collectiviteId, nodes, valeurs, totals } = useSousIndicateursQueries(
    indicateurId,
    options
  );

  return useMemo(
    () =>
      toSousIndicateursTableState({
        indicateurId,
        collectiviteId,
        nodes,
        valeurs,
        totals,
      }),
    [indicateurId, collectiviteId, nodes, valeurs, totals]
  );
};
