import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

const Vue = lazy(
  () =>
    import(
      '@/app/app/pages/collectivite/PlansActions/Synthese/SyntheseVue/SyntheseVue'
    )
);

/**
 * Page d'une vue synthèse des plans d'action
 */
export const SyntheseVuePage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Vue />
    </Suspense>
  );
};
