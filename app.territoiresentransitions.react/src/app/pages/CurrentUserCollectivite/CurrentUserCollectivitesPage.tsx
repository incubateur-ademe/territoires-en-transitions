import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const CurrentUserCollectivites = lazy(
  () => import('app/pages/CurrentUserCollectivite/CurrentUserCollectivites')
);

export const CurrentUserCollectivitesPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <CurrentUserCollectivites />
    </Suspense>
  );
};
