import {Suspense} from 'react';
import {lazy} from 'utils/lazy';
import {renderLoader} from 'utils/renderLoader';

const Trajectoire = lazy(
  () => import('app/pages/collectivite/Trajectoire/Trajectoire')
);

/**
 * La page Trajectoire SNBC
 */
export const TrajectoirePage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Trajectoire />
    </Suspense>
  );
};
