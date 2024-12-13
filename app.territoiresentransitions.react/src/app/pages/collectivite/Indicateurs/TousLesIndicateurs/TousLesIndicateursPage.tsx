import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const TousLesIndicateurs = lazy(
  () =>
    import(
      '@/app/app/pages/collectivite/Indicateurs/TousLesIndicateurs/TousLesIndicateurs'
    )
);

export const TousLesIndicateursPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <TousLesIndicateurs />
    </Suspense>
  );
};
