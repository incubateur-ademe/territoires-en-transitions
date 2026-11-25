'use client';

import { useIndicateurChart } from '../context/indicateur-chart.context';
import { useIndicateurData } from '../context/indicateur-data.context';
import { IndicateurPredefiniHeader } from './header/indicateur-predefini-header.view';
import { IndicateurPredefiniTabs } from './indicateur-predefini-tabs.view';
import { IndicateurSousIndicateurs } from './sous-indicateurs/indicateur-sous-indicateurs.view';

export const IndicateurPredefiniLayout = () => {
  const { indicateur, canMutateIndicateur } = useIndicateurData();
  const { chartInfo } = useIndicateurChart();

  const { enfants = [], sansValeurUtilisateur } = indicateur;
  const isComposeSansAgregation = enfants.length > 0 && sansValeurUtilisateur;

  return (
    <>
      <IndicateurPredefiniHeader
        chartInfo={isComposeSansAgregation ? undefined : chartInfo}
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
