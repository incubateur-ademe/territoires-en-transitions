import { useMemo } from 'react';
import {
  toSousIndicateursTableState,
  type SousIndicateursTableState,
} from '../sous-indicateurs-table-state.rules';
import { useSousIndicateursQueries } from './use-sous-indicateurs-queries';

export const useSousIndicateursTable = (
  indicateurId: number
): SousIndicateursTableState => {
  const { collectiviteId, nodes, valeurs, totals } =
    useSousIndicateursQueries(indicateurId);

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
