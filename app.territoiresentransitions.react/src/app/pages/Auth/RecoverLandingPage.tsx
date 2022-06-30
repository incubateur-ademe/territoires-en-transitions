import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';
import {Spacer} from 'ui/shared/Spacer';
import {useParams} from 'react-router-dom';

const RecoverLanding = lazy(() => import('./RecoverLanding'));

/**
 * La page de reset de mot passe.
 *
 * On arrive ici depuis un lien.
 */
export const RecoverLandingPage = () => {
  const {token} = useParams<{token: string}>();
  return (
    <Suspense fallback={renderLoader()}>
      <RecoverLanding token={token} />
      <Spacer />
    </Suspense>
  );
};
