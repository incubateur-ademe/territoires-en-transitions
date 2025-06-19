import { CurrentCollectivite } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const FicheAction = lazy(
  () =>
    import('@/app/app/pages/collectivite/PlansActions/FicheAction/FicheAction')
);

const FicheActionPage = ({
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

export default FicheActionPage;
