import {Suspense} from 'react';
import {lazy} from 'utils/lazy';
import {renderLoader} from 'utils/renderLoader';

const Indicateur = lazy(
  () => import('app/pages/collectivite/Indicateurs/Indicateur/Indicateur')
);

/**
 * Indicateurs page show both indicateurs personnalisés and indicateurs référentiel.
 */
export const IndicateurPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Indicateur />
    </Suspense>
  );
};
