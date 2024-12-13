import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const Indicateur = lazy(
  () => import('@/app/app/pages/collectivite/Indicateurs/Indicateur/Indicateur')
);

/**
 * Indicateurs page show both indicateurs personnalisés and indicateurs référentiel.
 */
export const IndicateurPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Indicateur />
    </Suspense>
  );
};
