import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

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
