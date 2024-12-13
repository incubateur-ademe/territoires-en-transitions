import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const Accueil = lazy(
  () => import('@/app/app/pages/collectivite/EtatDesLieux/Accueil/Accueil')
);

export const AccueilPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Accueil />
    </Suspense>
  );
};
