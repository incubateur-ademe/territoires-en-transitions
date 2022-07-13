import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';
import {Spacer} from 'ui/shared/Spacer';
import {useParams} from 'react-router-dom';

const ResetPasswordForm = lazy(() => import('./ResetPasswordForm'));

/**
 * Permet à l'utilisateur de réinitialiser son mot de passe.
 *
 * On arrive ici une fois que l'on est passé par RecoverLandingPage.
 */
export const ResetPasswordPage = () => {
  const {token} = useParams<{token: string}>();
  return (
    <Suspense fallback={renderLoader()}>
      <ResetPasswordForm token={token} />
      <Spacer />
    </Suspense>
  );
};
