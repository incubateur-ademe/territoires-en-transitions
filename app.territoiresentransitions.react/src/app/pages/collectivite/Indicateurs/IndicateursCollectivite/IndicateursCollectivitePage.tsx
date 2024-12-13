import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const IndicateursCollectivite = lazy(
  () =>
    import(
      '@/app/app/pages/collectivite/Indicateurs/IndicateursCollectivite/IndicateursCollectivite'
    )
);

export const IndicateursCollectivitePage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <IndicateursCollectivite />
    </Suspense>
  );
};
