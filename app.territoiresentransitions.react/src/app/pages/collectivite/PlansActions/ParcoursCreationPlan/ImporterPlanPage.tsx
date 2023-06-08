import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const ImporterPlan = lazy(
  () =>
    import(
      'app/pages/collectivite/PlansActions/ParcoursCreationPlan/ImporterPlan'
    )
);

export const ImporterPlanPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ImporterPlan />
    </Suspense>
  );
};
