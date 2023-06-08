import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const Selection = lazy(
  () =>
    import('app/pages/collectivite/PlansActions/ParcoursCreationPlan/Selection')
);

export const SelectionPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Selection />
    </Suspense>
  );
};
