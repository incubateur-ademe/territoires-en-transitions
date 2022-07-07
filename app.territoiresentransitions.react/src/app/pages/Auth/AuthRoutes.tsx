import {Route} from 'react-router-dom';
import {RegisterPage} from 'app/pages/Auth/RegisterPage';
import {SignInPage} from 'app/pages/Auth/SignInPage';
import {signUpPath, signInPath, resetPwdPath} from 'app/paths';
import {ResetPasswordPage} from './ResetPasswordPage';

export const AuthRoutes = () => {
  return (
    <>
      <Route path={signUpPath}>
        <RegisterPage />
      </Route>
      <Route path={signInPath}>
        <SignInPage />
      </Route>
      <Route path={resetPwdPath}>
        <ResetPasswordPage />
      </Route>
    </>
  );
};
