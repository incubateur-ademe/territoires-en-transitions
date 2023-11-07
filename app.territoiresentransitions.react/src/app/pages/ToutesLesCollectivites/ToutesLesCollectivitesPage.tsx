import {Suspense} from 'react';
import {lazy} from 'utils/lazy';
import {renderLoader} from 'utils/renderLoader';

const ToutesLesCollectivites = lazy(
  () => import('app/pages/ToutesLesCollectivites/ToutesLesCollectivites')
);

export const ToutesLesCollectivitesPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ToutesLesCollectivites />
    </Suspense>
  );
};
