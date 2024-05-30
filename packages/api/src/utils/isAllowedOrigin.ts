const DOMAIN = 'territoiresentransitions.fr';

/**
 * Vérifie l'origine des requêtes (pour ajouter ou non les en-têtes CORS)
 */
export const isAllowedOrigin = (
  origin: string,
  env: string,
  allowedOriginPattern?: string,
) => {
  // en mode dev ou test on laisse tout passer
  if (env !== 'production') {
    return true;
  }

  const {host} = new URL(origin);

  // si la var. d'env. n'est pas présente on n'autorise que notre domaine et ses sous-domaines
  if (!allowedOriginPattern) {
    return host === DOMAIN || host.endsWith(`.${DOMAIN}`);
  }

  // transforme le pattern donné en RegExp
  const rePattern = new RegExp(
    allowedOriginPattern.replaceAll('.', '\\.').replaceAll('*', '.*'),
  );
  return rePattern.test(origin);
};
