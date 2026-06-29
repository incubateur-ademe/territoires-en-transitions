import { ENV } from '../environmentVariables';

/**
 * Extrait le domaine racine
 * - transforme `app.territoiresentransitions.fr` en `territoiresentransitions.fr`
 * - garde `territoiresentransitions.fr` inchangé
 * - garde `localhost` inchangé
 */
export const getRootDomain = (host: string) => {
  if (ENV.application_env === 'ci') {
    return 'localhost';
  }

  // Si le hostname est une IP, on le renvoie tel quel
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return host;
  }

  // Remove port if present
  const hostname = host.split(':')[0];

  const parts = hostname.split('.');
  if (parts.length < 3) {
    return hostname;
  }

  return parts.slice(-2).join('.');
};

/**
 * Donne les URLs des pages d'authentification
 * @param redirect_to URL de la page vers laquelle rediriger après l'authentification.
 * @returns
 */
export const getAuthPaths = (redirect_to: string) => {
  const base = ENV.app_url;
  const params = new URLSearchParams({ redirect_to });
  return {
    base,
    login: `${base}/login?${params}`,
    signUp: `${base}/signup?${params}`,
    resetPwd: `${base}/recover?${params}`,
  };
};

export function getAuthUrl(pathname: string, searchParams: URLSearchParams) {
  const search = searchParams.size > 0 ? `?${searchParams.toString()}` : '';

  const authUrl = new URL(`${pathname}${search}`, ENV.app_url);
  return authUrl;
}

export const getCollectivitePath = (collectivite_id: number) =>
  `${process.env.NEXT_PUBLIC_APP_URL}/collectivite/${collectivite_id}/tableau-de-bord/synthetique`;

export const getCollectivitePlanPath = (
  collectivite_id: number,
  plan_id: number
) =>
  `${process.env.NEXT_PUBLIC_APP_URL}/collectivite/${collectivite_id}/plans/${plan_id}`;

export const getRejoindreCollectivitePath = (originUrl: string) => {
  const searchParams = new URLSearchParams({ redirect_to: originUrl });
  return getAuthUrl('/rejoindre-une-collectivite', searchParams).toString();
};
