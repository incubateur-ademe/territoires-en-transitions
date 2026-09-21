import { getPublicEnv } from './public-env';

/**
 * Configuration de l'application.
 *
 * Volontairement exposée via des *getters* : la valeur est résolue à chaque
 * accès, jamais au chargement du module. Un objet littéral serait évalué une
 * fois pour toutes — et donc potentiellement figé sur l'environnement de build
 * plutôt que sur celui du conteneur. Cf. `./public-env`.
 */
export const ENV = {
  get node_env() {
    return process.env.NODE_ENV;
  },
  get logActionsDuration() {
    return getPublicEnv().LOG_ACTION_DURATION === 'TRUE';
  },
  get supabase_anon_key() {
    return getPublicEnv().SUPABASE_ANON_KEY;
  },
  get supabase_url() {
    return getPublicEnv().SUPABASE_URL;
  },
  get backend_url() {
    return getPublicEnv().BACKEND_URL;
  },
  get sentry_dsn() {
    return getPublicEnv().SENTRY_DSN;
  },
  get crisp_website_id() {
    return getPublicEnv().CRISP_WEBSITE_ID;
  },
  get app_url() {
    return getPublicEnv().APP_URL;
  },
  get panier_url() {
    return getPublicEnv().PANIER_URL;
  },
  get site_url() {
    return getPublicEnv().SITE_URL;
  },
  get git_short_sha() {
    return getPublicEnv().GIT_SHORT_HASH;
  },
  get git_commit_timestamp() {
    return getPublicEnv().GIT_COMMIT_TIMESTAMP;
  },
  get application_version() {
    return getPublicEnv().APPLICATION_VERSION;
  },
  get application_env() {
    return getPublicEnv().ENV_NAME;
  },
  // Posé par le déploiement (Koyeb), lu uniquement côté serveur.
  get deployment_timestamp() {
    return process.env.DEPLOYMENT_TIMESTAMP;
  },
};
