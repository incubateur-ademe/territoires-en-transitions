import {Suspense} from 'react';
import {lazy} from 'utils/lazy';
import {renderLoader} from 'utils/renderLoader';

const IndicateursCollectivite = lazy(
  () =>
    import(
      'app/pages/collectivite/Indicateurs/IndicateursCollectivite/IndicateursCollectivite'
    )
);

export const IndicateursCollectivitePage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <IndicateursCollectivite />
    </Suspense>
  );
};
