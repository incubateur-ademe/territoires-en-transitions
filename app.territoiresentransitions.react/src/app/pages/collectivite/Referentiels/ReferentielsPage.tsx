import {useReferentielState} from 'core-logic/overmind/hooks';
import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const Referentiels = lazy(
  () => import('app/pages/collectivite/Referentiels/Referentiels')
);

export const ReferentielsPage = () => {
  useReferentielState();

  return (
    <Suspense fallback={renderLoader()}>
      <Referentiels />
    </Suspense>
  );
};
