'use client';

import { toSousIndicateursCapabilities } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-capabilities.rules';
import { type JSX, useEffect } from 'react';
import { ChartPngExportFrame } from '../../../chart/chart-png-export.frame';
import { useChartPngExport } from '../../../chart/use-chart-png-export';
import { useIndicateurData } from '../../context/indicateur-data.context';
import { useIndicateurSousIndicateursChart } from '../../context/indicateur-sous-indicateurs-chart.context';
import type { ChartPresentation } from './indicateur-sous-indicateurs-chart.option';
import { IndicateurSousIndicateursChart } from './indicateur-sous-indicateurs-chart.view';

type Props = ChartPresentation &
  Readonly<{
    indicateurId: number;
    title: string;
    onDone: () => void;
  }>;

export const IndicateurSousIndicateursChartPngExport = ({
  indicateurId,
  unite,
  periodicite,
  title,
  onDone,
}: Props): JSX.Element | null => {
  const { useSousIndicateursChart } = useIndicateurSousIndicateursChart();
  const { indicateur } = useIndicateurData();
  const state = useSousIndicateursChart(indicateurId, {
    withTotals: toSousIndicateursCapabilities(indicateur).canTotaliser,
  });
  const { containerRef, onFinished } = useChartPngExport({ title, onDone });
  const hasNothingToExport =
    state.status === 'error' ||
    (state.status === 'ready' && state.data === null);

  useEffect(() => {
    if (hasNothingToExport) {
      onDone();
    }
  }, [hasNothingToExport, onDone]);

  if (state.status !== 'ready' || state.data === null) {
    return null;
  }

  return (
    <ChartPngExportFrame containerRef={containerRef}>
      <IndicateurSousIndicateursChart
        indicateurId={indicateurId}
        unite={unite}
        periodicite={periodicite}
        title={title}
        onFinished={onFinished}
      />
    </ChartPngExportFrame>
  );
};
