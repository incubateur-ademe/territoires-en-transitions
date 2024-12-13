import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

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
