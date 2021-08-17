import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const RegisterForm = lazy(() => import('./RegisterForm'));

export const RegisterPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <RegisterForm />
    </Suspense>
  );
};
