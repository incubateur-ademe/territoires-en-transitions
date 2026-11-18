'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { isIndicateurPerso } from '@tet/domain/indicateurs';
import IndicateurHeader from './header/indicateur-header.view';
import { useIndicateurChart } from './context/indicateur-chart.context';
import { useIndicateurData } from './context/indicateur-data.context';
import { IndicateurSousIndicateurs } from './content/sous-indicateurs/indicateur-sous-indicateurs.view';
import { IndicateurTabs } from './indicateur-tabs.view';

export const IndicateurLayout = () => {
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
        isPerso={isIndicateurPerso(indicateur)}
        isComposeSansAgregation={isComposeSansAgregation}
      />

      <div className="pt-6">
        {isComposeSansAgregation ? (
          <IndicateurSousIndicateurs
            enfantsIds={enfants.map(({ id }) => id)}
            isReadonly={!canMutateIndicateur}
          />
        ) : (
          <IndicateurTabs />
        )}
      </div>
    </>
  );
};
