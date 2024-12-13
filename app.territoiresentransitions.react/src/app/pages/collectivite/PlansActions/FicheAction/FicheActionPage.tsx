import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const FicheAction = lazy(
  () =>
    import('@/app/app/pages/collectivite/PlansActions/FicheAction/FicheAction')
);

type FicheActionPageProps = {
  isReadonly: boolean;
};

const FicheActionPage = (props: FicheActionPageProps) => {
  return (
    <Suspense fallback={renderLoader()}>
      <FicheAction {...props} />
    </Suspense>
  );
};

export default FicheActionPage;
