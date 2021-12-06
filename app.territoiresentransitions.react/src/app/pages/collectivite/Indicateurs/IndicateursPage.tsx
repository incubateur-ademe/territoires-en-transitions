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
    <div className="fr-container my-5 flex flex-col">
      <Suspense fallback={renderLoader()}>
        <Indicateurs />
      </Suspense>
    </div>
  );
};
