import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

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
