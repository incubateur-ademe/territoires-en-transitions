import {Suspense} from 'react';
import {lazy} from 'utils/lazy';
import {renderLoader} from 'utils/renderLoader';
import {Spacer} from 'ui/dividers/Spacer';

const ResetPasswordForm = lazy(() => import('./ResetPasswordForm'));

/**
 * Permet à l'utilisateur de réinitialiser son mot de passe.
 *
 * On arrive ici une fois que l'on est passé par RecoverLandingPage.
 */
export const ResetPasswordPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ResetPasswordForm />
      <Spacer />
    </Suspense>
  );
};
