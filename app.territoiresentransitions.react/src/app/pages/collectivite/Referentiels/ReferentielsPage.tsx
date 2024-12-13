import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

const ReferentielTabs = lazy(
  () => import('@/app/app/pages/collectivite/Referentiels/ReferentielTabs')
);

export const ReferentielsPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ReferentielTabs />
    </Suspense>
  );
};
