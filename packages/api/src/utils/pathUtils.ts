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

/**
 * URL DES MODULES SUIVANT L'ENVIRONNEMENT
 *
 * DEV
 *  domain=localhost + port distinct (app=3000, site=3001, panier=3002,
 *  auth=3003)
 *
 * PREPROD dans le domaine TeT domain=territoiresentransitions.fr + sous-domaine
 *  distinct (preprod-app, preprod-site, preprod-panier, preprod-auth)
 *
 * PREPROD dans le domaine koyeb (pour permettre l'authent. depuis les app de
 *  test) domain=koyeb.app + sous-domaine distinct (preprod-app-tet,
 *  test-app-<branche>-tet, preprod-site-tet, preprod-panier-tet, preprod-auth-tet)
 *
 * PROD (domaine TeT) domain=territoiresentransitions.fr + sous-domaine distinct
 *  (app, panier, auth) ou pas de sous-domaine (ou wwww) pour le
 *  site
 */
export const getBaseUrl = (
  hostname: string,
  appName: string,
  devPort: number
) => {
  const domain = getRootDomain(hostname);
  if (domain === 'localhost') {
    return `http://localhost:${devPort}`;
  }

  const subdomain =
    hostname.includes('preprod') || domain === 'koyeb.app'
      ? domain === 'koyeb.app'
        ? `preprod-${appName}-tet`
        : `preprod-${appName}`
      : appName;
  return `https://${subdomain}.${domain}`;
};

/** Donne l'URL du module d'authentification */
const DEV_AUTH_PORT = 3003; // port pour le mode dev
export const getAuthBaseUrl = (hostname: string) =>
  getBaseUrl(hostname, 'auth', DEV_AUTH_PORT);

/** Donne l'URL de l'app pour rediriger après la connexion depuis le site */
const DEV_APP_PORT = 3000;
export const getAppBaseUrl = (hostname: string) =>
  getBaseUrl(hostname, 'app', DEV_APP_PORT);

/**
 * Donne les URLs des pages d'authentification
 * @param hostname URL de la page courante pour pouvoir déterminer les chemins.
 * @param redirect_to URL de la page vers laquelle rediriger après l'authentification.
 * @returns
 */
export const getAuthPaths = (hostname: string, redirect_to: string) => {
  const base = getAuthBaseUrl(hostname);
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
  `${getAuthBaseUrl(hostname)}/rejoindre-une-collectivite`;

/** Donne l'url d'une page collectivité */
export const getCollectivitePath = (hostname: string, collectivite_id: number) =>
  `${getAppBaseUrl(hostname)}/collectivite/${collectivite_id}/accueil`;
