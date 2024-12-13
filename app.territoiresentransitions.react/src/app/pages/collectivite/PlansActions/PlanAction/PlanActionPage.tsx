import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

const PlanAction = lazy(
  () =>
    import('@/app/app/pages/collectivite/PlansActions/PlanAction/PlanAction')
);

export const PlanActionPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <PlanAction />
    </Suspense>
  );
};
