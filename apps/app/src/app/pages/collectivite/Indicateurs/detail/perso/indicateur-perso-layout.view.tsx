'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useIndicateurChart } from '../context/indicateur-chart.context';
import { useIndicateurData } from '../context/indicateur-data.context';
import IndicateurHeader from '../header/indicateur-header.view';
import { IndicateurPersoTabs } from './indicateur-perso-tabs.view';

export const IndicateurPersoLayout = () => {
  const { indicateur, canMutateIndicateur } = useIndicateurData();
  const { chartInfo } = useIndicateurChart();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  return (
    <>
      <IndicateurHeader
        collectiviteId={collectiviteId}
        hasCollectivitePermission={hasCollectivitePermission}
        indicateur={indicateur}
        chartInfo={chartInfo}
        isReadonly={!canMutateIndicateur}
        isPerso
        isComposeSansAgregation={false}
      />

      <div className="pt-6">
        <IndicateurPersoTabs />
      </div>
    </>
  );
};
