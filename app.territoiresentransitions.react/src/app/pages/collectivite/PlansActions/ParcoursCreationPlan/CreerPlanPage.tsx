import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

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
