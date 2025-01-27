import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const Accueil = lazy(() => import('./tableau-de-bord.show'));

export const TableauDeBordPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Accueil />
    </Suspense>
  );
};
