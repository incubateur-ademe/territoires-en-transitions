import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const ReferentielTabs = lazy(
  () => import('@/app/referentiels/referentiel/referentiel.tabs')
);

export const ReferentielPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ReferentielTabs />
    </Suspense>
  );
};
