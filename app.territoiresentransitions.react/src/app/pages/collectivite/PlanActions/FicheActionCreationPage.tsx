import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const FicheActionCreator = lazy(
  () => import('app/pages/collectivite/PlanActions/FicheActionCreator')
);

/**
 * Indicateurs page show both indicateurs personnalisés and indicateurs référentiel.
 */
export const FicheActionCreationPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <FicheActionCreator />;
    </Suspense>
  );
};
