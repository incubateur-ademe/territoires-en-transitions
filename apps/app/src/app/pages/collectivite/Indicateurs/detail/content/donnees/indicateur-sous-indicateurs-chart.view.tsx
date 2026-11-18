'use client';

import type { SousIndicateursChartData } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-chart.rules';
import { appLabels } from '@/app/labels/catalog';
import { ReactECharts } from '@/app/ui/charts/echarts/ReactECharts';
import { useResizeGraphOnContainerSizeUpdate } from '@/app/ui/charts/echarts/use-resize-graph-on-container-size-update';
import PictoIndicateurVide from '@/app/ui/pictogrammes/PictoIndicateurVide';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { EmptyCard } from '@tet/ui';
import { type JSX, useId, useMemo, useRef } from 'react';
import { useIndicateurSousIndicateursChart } from '../../context/indicateur-sous-indicateurs-chart.context';
import {
  type ChartPresentation,
  toSousIndicateursChartOption,
} from './indicateur-sous-indicateurs-chart.option';

const CHART_HEIGHT = 450;

type Props = ChartPresentation & Readonly<{ indicateurId: number }>;

type ReadyChartProps = ChartPresentation &
  Readonly<{ data: SousIndicateursChartData }>;

const LoadingState = (): JSX.Element => (
  <div
    role="status"
    className="flex items-center justify-center"
    style={{ height: CHART_HEIGHT }}
  >
    <SpinnerLoader className="w-8 h-8 fill-primary-5" />
    <span className="sr-only">
      {appLabels.indicateurSousIndicateursChargement}
    </span>
  </div>
);

const ErrorState = (): JSX.Element => (
  <p role="alert" className="text-center text-sm text-grey-7">
    {appLabels.indicateurSousIndicateursErreur}
  </p>
);

const EmptyState = (): JSX.Element => (
  <EmptyCard
    size="xs"
    className="h-64 w-full"
    picto={(props) => <PictoIndicateurVide {...props} />}
    title={appLabels.aucuneValeurTrouvee}
  />
);

const ReadyChart = ({
  data,
  unite,
  periodicite,
}: ReadyChartProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const alternativeId = useId();
  const option = useMemo(
    () => toSousIndicateursChartOption({ data, unite, periodicite }),
    [data, unite, periodicite]
  );
  useResizeGraphOnContainerSizeUpdate({ containerRef });

  return (
    <>
      <div
        ref={containerRef}
        role="img"
        aria-label={appLabels.indicateurSousIndicateursValeurs}
        aria-describedby={alternativeId}
      >
        <ReactECharts option={option} style={{ height: CHART_HEIGHT }} />
      </div>
      <p id={alternativeId} className="sr-only">
        {appLabels.indicateurSousIndicateursGraphiqueAlternativeTableau}
      </p>
    </>
  );
};

export const IndicateurSousIndicateursChart = ({
  indicateurId,
  unite,
  periodicite,
}: Props): JSX.Element => {
  const { useSousIndicateursChart } = useIndicateurSousIndicateursChart();
  const state = useSousIndicateursChart(indicateurId);

  if (state.status === 'loading') {
    return <LoadingState />;
  }
  if (state.status === 'error') {
    return <ErrorState />;
  }
  if (state.data === null) {
    return <EmptyState />;
  }
  return (
    <ReadyChart data={state.data} unite={unite} periodicite={periodicite} />
  );
};
