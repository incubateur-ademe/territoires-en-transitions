import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const ToutesCollectivites = lazy(
  () => import('app/pages/ToutesCollectivites/ToutesCollectivites')
);

export const ToutesCollectivitesPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ToutesCollectivites />
    </Suspense>
  );
};
