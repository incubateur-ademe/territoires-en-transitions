import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const ReferentielTabs = lazy(
  () => import('app/pages/collectivite/Referentiels/ReferentielTabs')
);

export const ReferentielsPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ReferentielTabs />
    </Suspense>
  );
};
