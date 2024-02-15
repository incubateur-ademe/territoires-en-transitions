import {Route} from 'react-router-dom';
import {resetPwdPath, recoverLandingPath} from 'app/paths';
import {ResetPasswordPage} from './ResetPasswordPage';
import {RecoverLandingPage} from 'app/pages/Auth/RecoverLandingPage';

export const AuthRoutes = () => {
  return (
    <>
      <Route path={resetPwdPath}>
        <ResetPasswordPage />
      </Route>
      <Route path={recoverLandingPath}>
        <RecoverLandingPage />
      </Route>
    </>
  );
};
