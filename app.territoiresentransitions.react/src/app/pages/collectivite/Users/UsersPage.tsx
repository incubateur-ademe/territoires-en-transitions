import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const Referentiels = lazy(() => import('app/pages/collectivite/Users/Users'));

export const UsersPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Referentiels />
    </Suspense>
  );
};
