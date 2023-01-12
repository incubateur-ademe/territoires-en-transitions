import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const PlansActions = lazy(
  () => import('app/pages/collectivite/PlansActions/PlansActions')
);

export const PlansActionsPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <PlansActions />
    </Suspense>
  );
};
