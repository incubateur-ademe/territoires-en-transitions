/**
 * Extrait le domaine racine
 * - transforme `app.territoiresentransitions.fr` en `territoiresentransitions.fr`
 * - garde `territoiresentransitions.fr` inchangé
 * - garde `localhost` inchangé
 */
export const getRootDomain = () => {
  const hostname = document.location.hostname;
  const parts = hostname.split('.');
  return parts.length > 2 ? parts.toSpliced(0, 1).join('.') : hostname;
};

/** Donne l'URL de l'app */
const DEV_APP_PORT = 3000;
const APP_SUBDOMAIN = 'app';
export const getBaseUrlApp = () => {
  const domain = getRootDomain();
  const protocol = document.location.protocol;
  const subdomain = domain === 'localhost' ? '' : `${APP_SUBDOMAIN}.`;
  const port = domain === 'localhost' ? `:${DEV_APP_PORT}` : '';
  return `${protocol}//${subdomain}${domain}${port}`;
};

/** Donne l'URL du site */
const DEV_SITE_PORT = 3001;
export const getBaseUrlSite = () => {
  const domain = getRootDomain();
  const protocol = document.location.protocol;
  const port = domain === 'localhost' ? `:${DEV_SITE_PORT}` : '';
  return `${protocol}//${domain}${port}`;
};

/** Donne les URLs des pages d'authentification */
export const getAuthPaths = () => {
  const base = `${getBaseUrlSite()}/auth`;
  return {
    base,
    login: `${base}/login`,
    signUp: `${base}/signup`,
    resetPwd: `${base}/recover`,
  };
};

/** Donne l'url de la page "rejoindre une collectivité" */
export const getRejoindreCollectivitePath = () =>
  `${getBaseUrlSite()}/rejoindre-une-collectivite`;
