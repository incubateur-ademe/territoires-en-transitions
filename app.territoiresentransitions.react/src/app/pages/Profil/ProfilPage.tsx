import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

const Profil = lazy(() => import('@/app/app/pages/Profil/Profil'));

export const ProfilPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Profil />
    </Suspense>
  );
};
