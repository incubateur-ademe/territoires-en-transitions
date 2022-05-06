import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const ParcoursLabellisation = lazy(
  () =>
    import('app/pages/collectivite/ParcoursLabellisation/ParcoursLabellisation')
);

export const ParcoursLabellisationPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ParcoursLabellisation />
    </Suspense>
  );
};
