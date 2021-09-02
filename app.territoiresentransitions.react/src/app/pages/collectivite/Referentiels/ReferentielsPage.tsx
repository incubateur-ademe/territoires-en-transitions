import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const Referentiels = lazy(
  () => import('app/pages/collectivite/Referentiels/Referentiels')
);

export const ReferentielsPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Referentiels />
    </Suspense>
  );
};
