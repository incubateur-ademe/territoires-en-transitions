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
  isCumul,
  ...outcomes
}: SousIndicateursOutcomes &
  Readonly<{
    indicateurId: number;
    isCumul: boolean;
  }>): SousIndicateursChartState => {
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
      isCumul,
      ...sourceState.source,
    }),
  };
};
