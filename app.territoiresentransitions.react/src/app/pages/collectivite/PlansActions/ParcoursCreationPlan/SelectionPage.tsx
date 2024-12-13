import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const Selection = lazy(
  () =>
    import(
      '@/app/app/pages/collectivite/PlansActions/ParcoursCreationPlan/Selection'
    )
);

export const SelectionPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Selection />
    </Suspense>
  );
};
