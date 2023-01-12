import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const FicheAction = lazy(
  () => import('app/pages/collectivite/PlansActions/FicheAction/FicheAction')
);

export const FicheActionPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <FicheAction />
    </Suspense>
  );
};
