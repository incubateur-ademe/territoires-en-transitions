import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const FicheAction = lazy(
  () =>
    import('@/app/app/pages/collectivite/PlansActions/FicheAction/FicheAction')
);

export const FicheActionPage = ({
  collectivite,
}: {
  collectivite: CurrentCollectivite;
}) => {
  return (
    <Suspense fallback={renderLoader()}>
      <FicheAction collectivite={collectivite} />
    </Suspense>
  );
};
