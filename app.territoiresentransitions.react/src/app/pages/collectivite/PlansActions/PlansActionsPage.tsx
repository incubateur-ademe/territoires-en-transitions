import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

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
