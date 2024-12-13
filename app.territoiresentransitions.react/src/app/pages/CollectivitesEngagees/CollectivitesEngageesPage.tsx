import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const CollectivitesEngagees = lazy(
  () => import('@/app/app/pages/CollectivitesEngagees/CollectivitesEngagees')
);

export const CollectivitesEngageesPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <CollectivitesEngagees />
    </Suspense>
  );
};
