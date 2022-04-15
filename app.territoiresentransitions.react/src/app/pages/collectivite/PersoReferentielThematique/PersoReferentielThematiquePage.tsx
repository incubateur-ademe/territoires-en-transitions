import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const PersoReferentielThematique = lazy(
  () =>
    import(
      'app/pages/collectivite/PersoReferentielThematique/PersoReferentielThematique'
    )
);

export const PersoReferentielThematiquePage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <PersoReferentielThematique />
    </Suspense>
  );
};
