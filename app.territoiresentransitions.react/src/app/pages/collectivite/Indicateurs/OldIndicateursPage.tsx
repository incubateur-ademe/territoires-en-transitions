import {Suspense} from 'react';
import {lazy} from 'utils/lazy';
import {renderLoader} from 'utils/renderLoader';

const OldIndicateurs = lazy(
  () => import('app/pages/collectivite/Indicateurs/OldIndicateurs')
);

/**
 * Indicateurs page show both indicateurs personnalisés and indicateurs référentiel.
 */
export const OldIndicateursPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <OldIndicateurs />
    </Suspense>
  );
};
