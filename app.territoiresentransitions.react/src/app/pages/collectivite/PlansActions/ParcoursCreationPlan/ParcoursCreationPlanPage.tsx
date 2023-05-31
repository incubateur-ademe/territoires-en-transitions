import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const ParcoursCreationPlan = lazy(
  () =>
    import(
      'app/pages/collectivite/PlansActions/ParcoursCreationPlan/ParcoursCreationPlan'
    )
);

export const ParcoursCreationPlanPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ParcoursCreationPlan />
    </Suspense>
  );
};
