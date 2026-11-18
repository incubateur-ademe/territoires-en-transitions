import {
  buildSousIndicateursChartData,
  type SousIndicateursChartData,
} from './sous-indicateurs-chart.rules';
import {
  toSousIndicateursSourceState,
  type SousIndicateursNotReadyState,
  type SousIndicateursOutcomes,
} from './sous-indicateurs-table-state.rules';

export type SousIndicateursChartState =
  | SousIndicateursNotReadyState
  | Readonly<{ status: 'ready'; data: SousIndicateursChartData | null }>;

export const toSousIndicateursChartState = ({
  indicateurId,
  ...outcomes
}: SousIndicateursOutcomes &
  Readonly<{ indicateurId: number }>): SousIndicateursChartState => {
  const sourceState = toSousIndicateursSourceState({
    indicateurId,
    ...outcomes,
  });
  if (sourceState.status !== 'ready') {
    return sourceState;
  }
  return {
    status: 'ready',
    data: buildSousIndicateursChartData({
      rootId: indicateurId,
      ...sourceState.source,
    }),
  };
};
