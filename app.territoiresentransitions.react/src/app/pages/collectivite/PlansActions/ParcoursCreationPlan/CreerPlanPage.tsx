import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const CreerPlan = lazy(
  () =>
    import(
      '@/app/app/pages/collectivite/PlansActions/ParcoursCreationPlan/CreerPlan'
    )
);

export const CreerPlanPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <CreerPlan />
    </Suspense>
  );
};
