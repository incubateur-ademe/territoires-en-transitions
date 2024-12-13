import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

const PlansActions = lazy(
  () => import('@/app/app/pages/collectivite/PlansActions/PlansActions')
);

export const PlansActionsPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <PlansActions />
    </Suspense>
  );
};
