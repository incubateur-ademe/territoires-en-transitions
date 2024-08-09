import {Suspense} from 'react';
import {lazy} from 'utils/lazy';
import {renderLoader} from 'utils/renderLoader';

const FicheAction = lazy(
  () => import('app/pages/collectivite/PlansActions/FicheAction/FicheAction')
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
