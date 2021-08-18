import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const FichesList = lazy(
  () => import('app/pages/collectivite/PlanActions/FichesList')
);

/**
 * Indicateurs page show both indicateurs personnalisés and indicateurs référentiel.
 */
export const IndicateursPage = () => {
  return (
    <div className="my-5 flex flex-col">
      <Suspense fallback={renderLoader()}>
        <FichesList />
      </Suspense>
    </div>
  );
};
