/*
 * Fonctions pour enlever ou ajouter les cookies qui permettent de partager
 * l'authentification entre les sous-domaines.

 * Ref: https://github.com/orgs/supabase/discussions/5742#discussioncomment-4050444
*/
import { getRootDomain } from '@/api/utils/pathUtils';
import { Session, SupabaseClient, UserResponse } from '@supabase/supabase-js';
import { ENV } from '../environmentVariables';
import { supabaseClient } from './supabase-client';

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
    .map((cookie) => cookie.split('='))
    .filter((x) => x[0].match(SUPABASE_TOKEN))
    .forEach((x) => (document.cookie = formatExpiredToken(x[0], domain)));

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
    .map((cookie) => cookie.split('='));
  const accessTokenCookie = cookies.find((x) => x[0] === ACCESS_TOKEN);
  const refreshTokenCookie = cookies.find((x) => x[0] === REFRESH_TOKEN);

  if (accessTokenCookie && refreshTokenCookie) {
    // Check that the user still exists
    let userResponse: UserResponse | null = null;
    try {
      userResponse = await supabase.auth.getUser(accessTokenCookie[1]);
    } catch (error) {}
    if (!userResponse || userResponse.error) {
      // Disconnect by clearing the tokens
      clearAuthTokens(getRootDomain(document.location.hostname));

      return null;
    }

    const authResponse = await supabase.auth.setSession({
      access_token: accessTokenCookie[1],
      refresh_token: refreshTokenCookie[1],
    });
    return authResponse;
  }
  return null;
};

export async function getSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (data?.session) {
    return data.session;
  }
  if (error) throw error;

  // restaure une éventuelle session précédente
  const ret = await restoreSessionFromAuthTokens(supabaseClient);
  if (ret) {
    const { data, error } = ret;
    if (data?.session) {
      return data.session;
    }
    if (error) throw error;
  }
}

export async function getAuthHeaders() {
  const session = await getSession();
  return session?.access_token
    ? {
        authorization: `Bearer ${session.access_token}`,
        apikey: `${ENV.supabase_anon_key}`,
      }
    : null;
}
