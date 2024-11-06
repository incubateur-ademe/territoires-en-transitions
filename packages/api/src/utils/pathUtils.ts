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
  const base = process.env.NEXT_PUBLIC_AUTH_URL;
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
  `${process.env.NEXT_PUBLIC_APP_URL}/collectivite/${collectivite_id}/accueil`;

/** Donne l'url d'un plan d'action */
export const getCollectivitePlanPath = (
  collectivite_id: number,
  plan_id: number
) =>
  `${process.env.NEXT_PUBLIC_APP_URL}/collectivite/${collectivite_id}/plans/plan/${plan_id}`;

/** Donne l'url de la page "rejoindre une collectivité" */
export const getRejoindreCollectivitePath = (redirectTo: string) => {
  const params = new URLSearchParams({ redirect_to: redirectTo });
  return `${process.env.NEXT_PUBLIC_AUTH_URL}/rejoindre-une-collectivite?${params}`;
};
