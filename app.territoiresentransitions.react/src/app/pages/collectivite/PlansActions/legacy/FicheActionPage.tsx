import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const FicheActionEditor = lazy(
  () => import('app/pages/collectivite/PlansActions/legacy/FicheActionEditor')
);

/**
 * Indicateurs page show both indicateurs personnalisés and indicateurs référentiel.
 */
export const FicheActionPage = () => {
  return (
    <div className="my-5 flex flex-col">
      <Suspense fallback={renderLoader()}>
        <FicheActionEditor />
      </Suspense>
    </div>
  );
};
