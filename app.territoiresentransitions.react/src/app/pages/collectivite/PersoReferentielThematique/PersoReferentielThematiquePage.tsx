import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

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
