import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

const Accueil = lazy(
  () => import('app/pages/collectivite/EtatDesLieux/Accueil/Accueil')
);

const AccueilPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Accueil />
    </Suspense>
  );
};

export default AccueilPage;
