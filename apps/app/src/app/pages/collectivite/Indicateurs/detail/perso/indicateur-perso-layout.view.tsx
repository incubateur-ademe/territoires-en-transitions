'use client';

import { useIndicateurChart } from '../context/indicateur-chart.context';
import { IndicateurPersoHeader } from './header/indicateur-perso-header.view';
import { IndicateurPersoTabs } from './indicateur-perso-tabs.view';

export const IndicateurPersoLayout = () => {
  const { chartInfo } = useIndicateurChart();

  return (
    <>
      <IndicateurPersoHeader chartInfo={chartInfo} />

      <div className="pt-6">
        <IndicateurPersoTabs />
      </div>
    </>
  );
};
