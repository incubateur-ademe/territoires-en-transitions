import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const Accueil = lazy(() => import('app/pages/collectivite/Accueil/Accueil'));

const AccueilPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Accueil />
    </Suspense>
  );
};

export default AccueilPage;
