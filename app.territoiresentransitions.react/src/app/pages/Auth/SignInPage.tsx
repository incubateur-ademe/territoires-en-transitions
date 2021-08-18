import {signInRedirect} from 'core-logic/api/authRedirect';

/**
 * Redirects to the ADEME keycloak sign in form,
 * one could use the signInRedirect() directly.
 *
 * Then keycloak will redirect to `auth/redirect/`
 */
export const SignInPage = () => {
  signInRedirect();
  return <h1 className="fr-h1">Redirection vers moncompte.ademe.fr</h1>;
};
