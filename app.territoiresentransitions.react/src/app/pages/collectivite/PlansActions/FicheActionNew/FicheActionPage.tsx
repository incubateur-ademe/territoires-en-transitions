import {Suspense} from 'react';
import {lazy} from 'utils/lazy';
import {renderLoader} from 'utils/renderLoader';

const FicheAction = lazy(
  () => import('app/pages/collectivite/PlansActions/FicheActionNew/FicheAction')
);

type FicheActionPageProps = {
  readonly: boolean;
};

const FicheActionPage = (props: FicheActionPageProps) => {
  return (
    <Suspense fallback={renderLoader()}>
      <FicheAction {...props} />
    </Suspense>
  );
};

export default FicheActionPage;