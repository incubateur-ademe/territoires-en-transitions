import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

const PersoReferentielThematique = lazy(
  () =>
    import(
      '@/app/app/pages/collectivite/PersoReferentielThematique/PersoReferentielThematique'
    )
);

export const PersoReferentielThematiquePage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <PersoReferentielThematique />
    </Suspense>
  );
};
