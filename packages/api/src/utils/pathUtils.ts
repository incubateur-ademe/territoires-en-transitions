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
/** Donne l'URL du module d'authentification */
const DEV_SITE_PORT = 3003; // port pour le mode dev
export const getAuthBaseUrl = (hostname: string) => {
  const domain = getRootDomain(hostname);
  if (domain === 'localhost') {
    return `http://localhost:${DEV_SITE_PORT}`;
  }

    const subdomain =
      hostname.includes('preprod') || domain === 'koyeb.app'
        ? domain === 'koyeb.app'
          ? 'preprod-auth-tet'
          : 'preprod-auth'
        : 'auth';
  return `https://${subdomain}.${domain}`;
};

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
