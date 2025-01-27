import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const ParcoursLabellisation = lazy(
  () => import('@/app/referentiels/labellisations/ParcoursLabellisation')
);

export const ParcoursLabellisationPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ParcoursLabellisation />
    </Suspense>
  );
};
