import {Suspense} from 'react';
import {lazy} from 'utils/lazy';
import {renderLoader} from 'utils/renderLoader';
import {Spacer} from 'ui/dividers/Spacer';

const RegisterForm = lazy(() => import('./RegisterForm'));

/**
 * The user registration page, display the registration form.
 */
export const RegisterPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <RegisterForm />
      <Spacer />
    </Suspense>
  );
};