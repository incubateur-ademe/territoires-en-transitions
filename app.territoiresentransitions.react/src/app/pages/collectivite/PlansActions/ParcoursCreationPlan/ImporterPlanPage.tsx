import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

const ImporterPlan = lazy(
  () =>
    import(
      '@/app/app/pages/collectivite/PlansActions/ParcoursCreationPlan/ImporterPlan'
    )
);

export const ImporterPlanPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ImporterPlan />
    </Suspense>
  );
};
