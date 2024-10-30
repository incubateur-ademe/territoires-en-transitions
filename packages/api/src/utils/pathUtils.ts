import { ENV } from '../environmentVariables';

/**
 * Extrait le domaine racine
 * - transforme `app.territoiresentransitions.fr` en `territoiresentransitions.fr`
 * - garde `territoiresentransitions.fr` inchangé
 * - garde `localhost` inchangé
 */
export const getRootDomain = (hostname: string) => {
  // Si le hostname est une IP, on le renvoie tel quel
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return hostname;
  }

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
  const base = ENV.auth_url;
  const params = new URLSearchParams({ redirect_to });
  return {
    base,
    login: `${base}/login?${params}`,
    signUp: `${base}/signup?${params}`,
    resetPwd: `${base}/recover?${params}`,
  };
};

/** Donne l'url d'une page collectivité */
export const getCollectivitePath = (collectivite_id: number) =>
  `${ENV.app_url}/collectivite/${collectivite_id}/accueil`;

/** Donne l'url d'un plan d'action */
export const getCollectivitePlanPath = (
  collectivite_id: number,
  plan_id: number
) => `${ENV.app_url}/collectivite/${collectivite_id}/plans/plan/${plan_id}`;

/** Donne l'url de la page "rejoindre une collectivité" */
export const getRejoindreCollectivitePath = (redirectTo: string) => {
  const params = new URLSearchParams({ redirect_to: redirectTo });
  return `${ENV.auth_url}/rejoindre-une-collectivite?${params}`;
};
