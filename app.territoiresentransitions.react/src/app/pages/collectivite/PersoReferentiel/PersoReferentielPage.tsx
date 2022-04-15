import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const PersoReferentiel = lazy(
  () => import('app/pages/collectivite/PersoReferentiel/PersoReferentiel')
);

export const PersoReferentielPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <PersoReferentiel />
    </Suspense>
  );
};
