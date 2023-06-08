import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const Indicateurs = lazy(
  () => import('app/pages/collectivite/Indicateurs/Indicateurs')
);

/**
 * Indicateurs page show both indicateurs personnalisés and indicateurs référentiel.
 */
export const IndicateursPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Indicateurs />
    </Suspense>
  );
};
