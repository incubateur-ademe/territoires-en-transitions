import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

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
