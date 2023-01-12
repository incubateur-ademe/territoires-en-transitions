import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const PlanAction = lazy(
  () => import('app/pages/collectivite/PlansActions/PlanAction/PlanAction')
);

export const PlanActionPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <PlanAction />
    </Suspense>
  );
};
