import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';
import {Spacer} from 'ui/shared/Spacer';
import {useParams} from 'react-router-dom';

const ResetPasswordForm = lazy(() => import('./ResetPasswordForm'));

/**
 * The user registration page, display the registration form.
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
