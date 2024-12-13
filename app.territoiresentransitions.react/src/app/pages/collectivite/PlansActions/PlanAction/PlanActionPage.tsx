import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

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
