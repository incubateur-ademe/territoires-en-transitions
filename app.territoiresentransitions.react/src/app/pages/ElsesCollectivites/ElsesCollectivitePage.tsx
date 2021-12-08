import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const ElsesCollectivites = lazy(
  () => import('app/pages/ElsesCollectivites/ElsesCollectivites')
);

export const ElsesCollectivitesPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ElsesCollectivites />
    </Suspense>
  );
};
