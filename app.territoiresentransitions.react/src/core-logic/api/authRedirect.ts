import {getCurrentEnvironment} from 'core-logic/api/currentEnvironment';
import {signOut} from 'core-logic/api/authentication';

// Those functions use window.
// They probably should be rewritten if we want to use SSR.

/**
 * Redirects to the ADEME keycloak sign in form.
 *
 * Then keycloak will redirect to `auth/redirect/`
 */
export const signInRedirect = () => {
  const environment = getCurrentEnvironment();
  let host = window.location.hostname;

  // use sandbox for local dev as keycloak doesn't support localhost as a valid redirect domain.
  if (environment === 'local') host = 'sandbox.territoiresentransitions.fr';

  const redirect = `https://${host}/auth/redirect/`;
  const realm = 'master';
  const keycloak = 'https://moncompte.ademe.fr';

  window.location.href =
    `${keycloak}/auth/realms/${realm}/protocol/openid-connect/auth` +
    `?client_id=territoiresentransitions&response_type=code&redirect_uri=${redirect}`;
};

/**
 * Redirects to keycloak sign out endpoint
 */
export const signOutRedirect = () => {
  signOut();

  const host = window.location.hostname;
  const logout = `https://${host}`;
  const realm = 'master';
  const keycloak = 'https://moncompte.ademe.fr';

  window.location.href =
    `${keycloak}/auth/realms/${realm}/protocol/openid-connect/logout/` +
    `?redirect_uri=${logout}`;
};
