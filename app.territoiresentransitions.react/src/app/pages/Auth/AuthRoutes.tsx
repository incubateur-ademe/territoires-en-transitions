import {Route, useRouteMatch} from 'react-router-dom';
import {IdentityPage} from 'app/pages/Auth/IdentityPage';
import {RedirectPage} from 'app/pages/Auth/RedirectPage';
import {RegisterPage} from 'app/pages/Auth/RegisterPage';
import {SignInPage} from 'app/pages/Auth/SignInPage';
import {SignOutPage} from 'app/pages/Auth/SignOutPage';

export const AuthRoutes = () => {
  const {path} = useRouteMatch();

  return (
    <>
      <Route path={`${path}/identity/`}>
        <IdentityPage />
      </Route>
      <Route path={`${path}/redirect/`}>
        <RedirectPage />
      </Route>
      <Route path={`${path}/register/`}>
        <RegisterPage />
      </Route>
      <Route path={`${path}/signin/`}>
        <SignInPage />
      </Route>
      <Route path={`${path}/signout/`}>
        <SignOutPage />
      </Route>
    </>
  );
};
