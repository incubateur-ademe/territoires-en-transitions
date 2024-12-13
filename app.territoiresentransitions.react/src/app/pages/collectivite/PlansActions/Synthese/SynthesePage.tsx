import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

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
