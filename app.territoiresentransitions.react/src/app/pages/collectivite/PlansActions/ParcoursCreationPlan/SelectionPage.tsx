import { useCollectiviteId } from '@/api/collectivites';
import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const Selection = lazy(() =>
  import(
    '@/app/app/pages/collectivite/PlansActions/ParcoursCreationPlan/Selection'
  ).then((module) => ({ default: module.Selection }))
);

export const SelectionPage = () => {
  const collectiviteId = useCollectiviteId();
  return (
    <Suspense fallback={renderLoader()}>
      <Selection collectiviteId={collectiviteId} />
    </Suspense>
  );
};
