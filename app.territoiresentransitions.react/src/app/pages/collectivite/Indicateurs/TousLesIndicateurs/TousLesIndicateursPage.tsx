import {Suspense} from 'react';
import {lazy} from 'utils/lazy';
import {renderLoader} from 'utils/renderLoader';

const TousLesIndicateurs = lazy(
  () =>
    import(
      'app/pages/collectivite/Indicateurs/TousLesIndicateurs/TousLesIndicateurs'
    )
);

export const TousLesIndicateursPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <TousLesIndicateurs />
    </Suspense>
  );
};
