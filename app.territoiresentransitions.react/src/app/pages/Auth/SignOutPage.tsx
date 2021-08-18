import {signOutRedirect} from 'core-logic/api/authRedirect';

/**
 * Erase local tokens then redirects to the ADEME keycloak sign out form,
 * one could use the signOutRedirect() directly.
 */
export const SignOutPage = () => {
  signOutRedirect();
  return <h1 className="fr-h1">Redirection vers moncompte.ademe.fr</h1>;
};
