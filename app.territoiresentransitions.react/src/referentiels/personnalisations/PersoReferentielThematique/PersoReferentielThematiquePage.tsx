import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const PersoReferentielThematique = lazy(
  () => import('./PersoReferentielThematique')
);

export const PersoReferentielThematiquePage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <PersoReferentielThematique />
    </Suspense>
  );
};
