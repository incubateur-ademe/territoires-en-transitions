import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const Membres = lazy(() => import('app/pages/collectivite/Users/Membres'));

export const MembresPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Membres />
    </Suspense>
  );
};
