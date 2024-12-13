import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

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
