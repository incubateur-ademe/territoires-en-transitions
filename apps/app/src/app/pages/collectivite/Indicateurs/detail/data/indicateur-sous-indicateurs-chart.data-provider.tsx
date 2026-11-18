'use client';

import { useSousIndicateursChart } from '@/app/indicateurs/sous-indicateurs/data/use-sous-indicateurs-chart';
import type { JSX, PropsWithChildren } from 'react';
import {
  IndicateurSousIndicateursChartProvider,
  type IndicateurSousIndicateursChartValue,
} from '../context/indicateur-sous-indicateurs-chart.context';

const SOUS_INDICATEURS_CHART_VALUE: IndicateurSousIndicateursChartValue = {
  useSousIndicateursChart,
};

export const IndicateurSousIndicateursChartDataProvider = ({
  children,
}: PropsWithChildren): JSX.Element => (
  <IndicateurSousIndicateursChartProvider value={SOUS_INDICATEURS_CHART_VALUE}>
    {children}
  </IndicateurSousIndicateursChartProvider>
);
