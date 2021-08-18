import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const RegisterForm = lazy(() => import('./RegisterForm'));

/**
 * The user registration page, display the registration form.
 */
export const RegisterPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <RegisterForm />
    </Suspense>
  );
};
