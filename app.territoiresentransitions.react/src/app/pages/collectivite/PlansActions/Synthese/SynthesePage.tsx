import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const Synthese = lazy(
  () => import('app/pages/collectivite/PlansActions/Synthese/Synthese')
);

/**
 * Page Synthèse des plans d'action
 *
 * @param collectiviteId - (number) id de la collectivité affichée
 */

type SynthesePageProps = {
  collectiviteId: number;
};

export const SynthesePage = ({collectiviteId}: SynthesePageProps) => {
  return (
    <Suspense fallback={renderLoader()}>
      <Synthese collectiviteId={collectiviteId} />
    </Suspense>
  );
};
