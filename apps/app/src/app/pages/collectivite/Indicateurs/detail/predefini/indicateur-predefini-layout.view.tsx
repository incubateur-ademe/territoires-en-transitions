'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useIndicateurChart } from '../context/indicateur-chart.context';
import { useIndicateurData } from '../context/indicateur-data.context';
import IndicateurHeader from '../header/indicateur-header.view';
import { IndicateurPredefiniTabs } from './indicateur-predefini-tabs.view';
import { IndicateurSousIndicateurs } from './sous-indicateurs/indicateur-sous-indicateurs.view';

export const IndicateurPredefiniLayout = () => {
  const { indicateur, canMutateIndicateur } = useIndicateurData();
  const { chartInfo } = useIndicateurChart();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  const { enfants = [], sansValeurUtilisateur } = indicateur;
  const isComposeSansAgregation = enfants.length > 0 && sansValeurUtilisateur;

  return (
    <>
      <IndicateurHeader
        collectiviteId={collectiviteId}
        hasCollectivitePermission={hasCollectivitePermission}
        indicateur={indicateur}
        chartInfo={isComposeSansAgregation ? undefined : chartInfo}
        isReadonly={!canMutateIndicateur}
        isPerso={false}
        isComposeSansAgregation={isComposeSansAgregation}
      />

      <div className="pt-6">
        {isComposeSansAgregation ? (
          <IndicateurSousIndicateurs
            enfantsIds={enfants.map(({ id }) => id)}
            isReadonly={!canMutateIndicateur}
          />
        ) : (
          <IndicateurPredefiniTabs />
        )}
      </div>
    </>
  );
};
