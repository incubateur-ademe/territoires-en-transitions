import {useQuery, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {ENV} from 'environmentVariables';
import {useRecoveryToken} from './useRecoveryToken';

// renvoi une clé d'identificaton de la requête de vérification du jeton de récupération
const getQueryKey = (recoveryToken: string | null) => [
  'recover',
  recoveryToken,
];
// vérifie un jeton récupération et renvoi le jeton d'accès quand la requête réussie

export const useVerifyRecoveryToken = () => {
  const recoveryToken = useRecoveryToken();
  const {
    isLoading,
    isError,
    data: accessToken,
  } = useQuery(getQueryKey(recoveryToken), () => recover(recoveryToken));
  return {
    isError,
    isLoading,
    accessToken,
  };
};
// renvoi le dernier jeton d'accès obtenu après vérification du jeton de récupération

export const useAccessToken = (): string | null | undefined => {
  const recoveryToken = useRecoveryToken();
  const queryClient = useQueryClient();
  return queryClient.getQueryData(getQueryKey(recoveryToken));
};
/**
 * Réponse de l'appel à la fonction verify de gotrue.
 */
type VerifyResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};
/**
 * Permet de s'authentifier avec un recovery token.
 *
 * Consomme le recovery token et authentifie l'utilisateur.
 *
 * Port d'une fonction présente dans lib gotrue-js
 * mais absente de la version supabase.
 *
 * @param token: recovery token provenant du mail.
 * @returns un access token.
 */
const recover = async (
  token: string | null
): Promise<VerifyResponse | null> => {
  if (!token) {
    return null;
  }

  const url = `${ENV.supabase_url!}/auth/v1/verify`;
  const type = 'recovery';
  const body = JSON.stringify({token, type});

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ENV.supabase_anon_key!,
    },
    body,
  });
  if (!response.ok) {
    throw new Error('Erreur de vérification du jeton');
  }
  const data = await response.json();

  // supabaseClient.auth.setAuth(data.access_token); ne fonctionne pas.
  // fixme va sans doute être redirigée.
  // await supabaseClient.auth.signIn({refreshToken: data.refresh_token});

  // TODO: utiliser API supabase-js v2
  //const { data, error } = supabase.auth.setSession({refresh_token, access_token})

  return data?.access_token || null;
};
