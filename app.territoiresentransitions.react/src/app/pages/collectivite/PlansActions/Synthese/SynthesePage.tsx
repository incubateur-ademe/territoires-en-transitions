import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

const Synthese = lazy(
  () => import('@/app/app/pages/collectivite/PlansActions/Synthese/Synthese')
);

/**
 * Page Synthèse des plans d'action
 *
 * @param collectiviteId - (number) id de la collectivité affichée
 */

type SynthesePageProps = {
  collectiviteId: number;
};

export const SynthesePage = ({ collectiviteId }: SynthesePageProps) => {
  return (
    <Suspense fallback={renderLoader()}>
      <Synthese collectiviteId={collectiviteId} />
    </Suspense>
  );
};
