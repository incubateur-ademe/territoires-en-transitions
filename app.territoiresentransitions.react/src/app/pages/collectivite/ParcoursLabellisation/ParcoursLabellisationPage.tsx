import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const ParcoursLabellisation = lazy(
  () =>
    import(
      '@/app/app/pages/collectivite/ParcoursLabellisation/ParcoursLabellisation'
    )
);

export const ParcoursLabellisationPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ParcoursLabellisation />
    </Suspense>
  );
};
