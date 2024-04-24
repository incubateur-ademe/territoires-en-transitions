/* 
 * Fonctions pour enlever ou ajouter les cookies qui permettent de partager
 * l'authentification entre les sous-domaines. 

 * Ref: https://github.com/orgs/supabase/discussions/5742#discussioncomment-4050444
*/
import {Session, SupabaseClient} from '@supabase/supabase-js';

export const ACCESS_TOKEN = 'tet-access-token';
export const REFRESH_TOKEN = 'tet-refresh-token';

/** Enlève les tokens */
const EXPIRED = new Date(0).toUTCString();
const formatExpiredToken = (name: string, domain: string) =>
  `${name}=; Domain=${domain}; path=/; expires=${EXPIRED}; SameSite=Lax; secure`;
export const clearAuthTokens = (domain: string) => {
  document.cookie = formatExpiredToken(ACCESS_TOKEN, domain);
  document.cookie = formatExpiredToken(REFRESH_TOKEN, domain);
  deleteSbCookies(domain);
};

/**
 * Supprime les tokens écrits par le client supabase (appelé lors de la déconnexion)
 * Ref: https://github.com/supabase/auth-js/issues/46
 */
const SUPABASE_TOKEN = /^sb-.*-auth-token/;
const deleteSbCookies = (domain: string) =>
  document.cookie
    .split(/\s*;\s*/)
    .map(cookie => cookie.split('='))
    .filter(x => x[0].match(SUPABASE_TOKEN))
    .forEach(x => (document.cookie = formatExpiredToken(x[0], domain)));

/** Crée les tokens à partir de la session */
const MAX_AGE = 60 * 60 * 24 * 365;
export const formatAuthToken = (
  name: string,
  value: string,
  domain: string,
  maxAge: number = MAX_AGE
) =>
  `${name}=${value}; Domain=${domain}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;

/** Crée et ajoute les tokens */
export const setAuthTokens = (session: Session, domain: string) => {
  document.cookie = formatAuthToken(ACCESS_TOKEN, session.access_token, domain);
  document.cookie = formatAuthToken(
    REFRESH_TOKEN,
    session.refresh_token,
    domain
  );
};

/** Restaure la session depuis les tokens */
export const restoreSessionFromAuthTokens = async (
  supabase: SupabaseClient
) => {
  if (typeof window === 'undefined') {
    return;
  }

  // recherche les cookies
  const cookies = document.cookie
    .split(/\s*;\s*/)
    .map(cookie => cookie.split('='));
  const accessTokenCookie = cookies.find(x => x[0] === ACCESS_TOKEN);
  const refreshTokenCookie = cookies.find(x => x[0] === REFRESH_TOKEN);

  if (accessTokenCookie && refreshTokenCookie) {
    return supabase.auth.setSession({
      access_token: accessTokenCookie[1],
      refresh_token: refreshTokenCookie[1],
    });
  }
  return null;
};
