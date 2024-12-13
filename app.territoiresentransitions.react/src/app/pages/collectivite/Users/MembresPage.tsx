import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

const Membres = lazy(
  () => import('@/app/app/pages/collectivite/Users/Membres')
);

export const MembresPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Membres />
    </Suspense>
  );
};
