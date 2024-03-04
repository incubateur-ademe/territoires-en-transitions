/**
 * Extrait le domaine racine
 * - transforme `app.territoiresentransitions.fr` en `territoiresentransitions.fr`
 * - garde `territoiresentransitions.fr` inchangé
 * - garde `localhost` inchangé
 */
export const getRootDomain = (hostname: string) => {
  const parts = hostname.split('.');
  return parts.length > 2 ? parts.toSpliced(0, 1).join('.') : hostname;
};

/** Donne l'URL du site */
const DEV_SITE_PORT = 3001;
export const getBaseUrlSite = (hostname: string) => {
  const domain = getRootDomain(hostname);
  const protocol = document.location.protocol;
  const port = domain === 'localhost' ? `:${DEV_SITE_PORT}` : '';
  return `${protocol}//${domain}${port}`;
};

/**
 * Donne les URLs des pages d'authentification
 * @param hostname URL de la page courante pour pouvoir déterminer les chemins.
 * @param redirect_to URL de la page vers laquelle rediriger après l'authentification.
 * @returns
 */
export const getAuthPaths = (hostname: string, redirect_to: string) => {
  const base = `${getBaseUrlSite(hostname)}/auth`;
  const params = new URLSearchParams({redirect_to});
  return {
    base,
    login: `${base}/login?${params}`,
    signUp: `${base}/signup?${params}`,
    resetPwd: `${base}/recover?${params}`,
  };
};

/** Donne l'url de la page "rejoindre une collectivité" */
export const getRejoindreCollectivitePath = (hostname: string) =>
  `${getBaseUrlSite(hostname)}/rejoindre-une-collectivite`;
