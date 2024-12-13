import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const ToutesLesFichesAction = lazy(
  () =>
    import(
      '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/ToutesLesFichesAction'
    )
);

export const ToutesLesFichesActionPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ToutesLesFichesAction />
    </Suspense>
  );
};
