import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

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
