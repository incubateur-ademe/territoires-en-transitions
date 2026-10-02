import type { Strapi } from '@strapi/strapi';
import { createHmac } from 'node:crypto';

/**
 * Seed d'un token API read-only pour le dev local.
 *
 * `strapi transfer` (make cms-pull) importe le contenu mais pas les tokens
 * API (ce sont des secrets runtime), et le token commité dans apps/site/.env
 * appartient à l'instance Strapi Cloud distante → l'instance locale le rejette
 * en 401 et le site plante (data null). On (re)crée donc à chaque boot un
 * token dont la valeur en clair est fixe (STRAPI_LOCAL_READONLY_TOKEN), pour
 * que le site (NEXT_PUBLIC_STRAPI_KEY, même valeur dans apps/site/.env) puisse
 * lire l'API locale sans manip manuelle.
 *
 * La variable n'est définie que dans la stack docker locale (docker-compose) :
 * en prod elle est absente → aucun seed.
 */
const seedLocalReadonlyToken = async (strapi: Strapi) => {
  const token = process.env.STRAPI_LOCAL_READONLY_TOKEN;
  if (!token) return;

  const name = 'local-dev-readonly';
  // Strapi hache les access keys en HMAC-SHA512 avec admin.apiToken.salt ; on
  // reproduit le même hachage pour que le token en clair envoyé par le site
  // corresponde à la ligne stockée.
  const salt = strapi.config.get('admin.apiToken.salt') as string;
  const accessKey = createHmac('sha512', salt).update(token).digest('hex');

  const existing = await strapi.db
    .query('admin::api-token')
    .findOne({ where: { name } });

  if (existing) {
    if (existing.accessKey !== accessKey) {
      await strapi.db
        .query('admin::api-token')
        .update({
          where: { id: existing.id },
          data: { accessKey, type: 'read-only' },
        });
      strapi.log.info(`[bootstrap] token API local « ${name} » mis à jour`);
    }
    return;
  }

  await strapi.db.query('admin::api-token').create({
    data: {
      name,
      description: 'Token read-only seedé pour le dev local (app site)',
      type: 'read-only',
      accessKey,
      lifespan: null,
      expiresAt: null,
    },
  });
  strapi.log.info(`[bootstrap] token API local « ${name} » seedé (read-only)`);
};

/**
 * Référencement initial de la page Démarche PCAET.
 *
 * Les migrations de `database/migrations` passent avant la synchronisation du
 * schéma : au premier déploiement, la table de ce type de contenu n'existe pas
 * encore. On crée donc l'entrée ici, une seule fois : une fois qu'elle existe,
 * l'admin en est seul maître.
 */
const seedDemarchePcaetSeo = async (strapi: Strapi) => {
  const uid = 'api::page-demarche-pcaet.page-demarche-pcaet';
  const existing = await strapi.entityService.findMany(uid);
  if (existing) return;

  await strapi.entityService.create(uid, {
    data: {
      seo: {
        metaTitle: 'Déposer votre PCAET (Plan Climat-Air-Énergie Territorial)',
        metaDescription:
          "Déposez votre Plan Climat sur Territoires en Transitions : un parcours de dépôt du PCAET guidé étape par étape, de l'élaboration à l'adoption, et un outil de pilotage pour suivre vos actions.",
      },
      publishedAt: new Date(),
    },
  });
  strapi.log.info('[bootstrap] référencement de la page Démarche PCAET créé');
};

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }: { strapi: Strapi }) {
    await seedLocalReadonlyToken(strapi);
    await seedDemarchePcaetSeo(strapi);
  },
};
