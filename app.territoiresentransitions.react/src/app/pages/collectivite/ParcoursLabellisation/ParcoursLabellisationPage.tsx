import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

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
