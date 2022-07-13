import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';
import {Spacer} from 'ui/shared/Spacer';

const RecoverLanding = lazy(() => import('./RecoverLanding'));

/**
 * La page de reset de mot passe.
 *
 * On arrive ici depuis un lien.
 */
export const RecoverLandingPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <RecoverLanding />
      <Spacer />
    </Suspense>
  );
};
