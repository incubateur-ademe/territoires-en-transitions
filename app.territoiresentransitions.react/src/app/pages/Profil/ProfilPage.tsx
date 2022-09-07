import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const Profil = lazy(() => import('app/pages/Profil/Profil'));

export const ProfilPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Profil />
    </Suspense>
  );
};
