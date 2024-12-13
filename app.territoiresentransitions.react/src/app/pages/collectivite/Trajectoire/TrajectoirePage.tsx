import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const Trajectoire = lazy(
  () => import('@/app/app/pages/collectivite/Trajectoire/Trajectoire')
);

/**
 * La page Trajectoire SNBC
 */
export const TrajectoirePage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Trajectoire />
    </Suspense>
  );
};
