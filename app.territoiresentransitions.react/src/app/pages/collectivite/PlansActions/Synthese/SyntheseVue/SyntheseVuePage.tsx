import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const Vue = lazy(
  () =>
    import(
      'app/pages/collectivite/PlansActions/Synthese/SyntheseVue/SyntheseVue'
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
