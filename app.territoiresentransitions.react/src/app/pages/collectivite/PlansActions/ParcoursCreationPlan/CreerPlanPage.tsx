import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const CreerPlan = lazy(
  () =>
    import('app/pages/collectivite/PlansActions/ParcoursCreationPlan/CreerPlan')
);

export const CreerPlanPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <CreerPlan />
    </Suspense>
  );
};
