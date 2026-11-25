'use client';

import { useIndicateurChart } from '../context/indicateur-chart.context';
import { useIndicateurData } from '../context/indicateur-data.context';
import { IndicateurPredefiniHeader } from './header/indicateur-predefini-header.view';
import { isComposeSansAgregation } from './indicateur-predefini-compose.rules';
import { IndicateurPredefiniTabs } from './indicateur-predefini-tabs.view';

export const IndicateurPredefiniLayout = () => {
  const { indicateur } = useIndicateurData();
  const { chartInfo } = useIndicateurChart();

  const isCompose = isComposeSansAgregation(indicateur);

  return (
    <>
      <IndicateurPredefiniHeader
        chartInfo={isCompose ? undefined : chartInfo}
        isComposeSansAgregation={isCompose}
      />

      <div className="pt-6">
        <IndicateurPredefiniTabs />
      </div>
    </>
  );
};
