import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const PersoReferentiel = lazy(
  () => import('@/app/app/pages/collectivite/PersoReferentiel/PersoReferentiel')
);

export const PersoReferentielPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <PersoReferentiel />
    </Suspense>
  );
};
