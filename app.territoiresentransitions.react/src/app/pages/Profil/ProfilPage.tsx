import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const Profil = lazy(() => import('@/app/app/pages/Profil/Profil'));

export const ProfilPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Profil />
    </Suspense>
  );
};
