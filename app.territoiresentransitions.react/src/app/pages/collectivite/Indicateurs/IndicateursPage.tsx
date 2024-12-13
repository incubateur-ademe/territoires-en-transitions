import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const Indicateurs = lazy(
  () => import('@/app/app/pages/collectivite/Indicateurs/Indicateurs')
);

/**
 * Indicateurs page show both indicateurs personnalisés and indicateurs référentiel.
 */
export const IndicateursPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Indicateurs />
    </Suspense>
  );
};
