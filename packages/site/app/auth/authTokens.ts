/* 
 * Fonctions pour enlever ou ajouter les cookies qui permettent de partager
 * l'authentification entre les sous-domaines. 

 * Ref: https://github.com/orgs/supabase/discussions/5742#discussioncomment-4050444
*/
import {Session, SupabaseClient} from '@supabase/supabase-js';

const ACCESS_TOKEN = 'tet-access-token';
const REFRESH_TOKEN = 'tet-refresh-token';

/** Enlève les tokens */
export const clearAuthTokens = (domain: string) => {
  const expires = new Date(0).toUTCString();
  document.cookie = `${ACCESS_TOKEN}=; Domain=${domain}; path=/; expires=${expires}; SameSite=Lax; secure`;
  document.cookie = `${REFRESH_TOKEN}=; Domain=${domain}; path=/; expires=${expires}; SameSite=Lax; secure`;
};

/** Ajoute les tokens */
export const setAuthTokens = (session: Session, domain: string) => {
  const maxAge = 100 * 365 * 24 * 60 * 60; // 100 years, never expires
  document.cookie = `${ACCESS_TOKEN}=${session.access_token}; Domain=${domain}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
  document.cookie = `${REFRESH_TOKEN}=${session.refresh_token}; Domain=${domain}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
};

/** Restaure l'authentification depuis les tokens */
export const restoreAuthTokens = async (supabase: SupabaseClient) => {
  const cookies = document.cookie
    .split(/\s*;\s*/)
    .map(cookie => cookie.split('='));
  const accessTokenCookie = cookies.find(x => x[0] === ACCESS_TOKEN);
  const refreshTokenCookie = cookies.find(x => x[0] === REFRESH_TOKEN);

  if (accessTokenCookie && refreshTokenCookie) {
    await supabase.auth.setSession({
      access_token: accessTokenCookie[1],
      refresh_token: refreshTokenCookie[1],
    });
  }
};
