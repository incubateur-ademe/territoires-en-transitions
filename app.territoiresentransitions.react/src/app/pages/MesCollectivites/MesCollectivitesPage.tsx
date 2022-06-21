import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const MesCollectivites = lazy(() => import('./MesCollectivites'));

export const MesCollectivitesPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <MesCollectivites />
    </Suspense>
  );
};
