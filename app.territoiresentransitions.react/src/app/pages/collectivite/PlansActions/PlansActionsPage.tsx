import { CurrentCollectivite } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const PlansActions = lazy(() =>
  import('@/app/app/pages/collectivite/PlansActions/PlansActions').then(
    (module) => ({
      default: module.PlansActions,
    })
  )
);

export const PlansActionsPage = ({
  collectivite,
}: {
  collectivite: CurrentCollectivite;
}) => {
  return (
    <Suspense fallback={renderLoader()}>
      <PlansActions collectivite={collectivite} />
    </Suspense>
  );
};
