import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const PlanActions = lazy(
  () => import('app/pages/collectivite/PlanActions/PlanActions')
);

/**
 * Indicateurs page show both indicateurs personnalisés and indicateurs référentiel.
 */
export const PlanActionPage = () => {
  return (
    <div className="my-5 flex flex-col">
      <Suspense fallback={renderLoader()}>
        <PlanActions />
      </Suspense>
    </div>
  );
};
