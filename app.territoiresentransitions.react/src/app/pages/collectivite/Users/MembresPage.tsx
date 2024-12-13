import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

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
