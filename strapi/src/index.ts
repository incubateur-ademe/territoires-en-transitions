import { createHmac } from 'node:crypto';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

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
  async bootstrap({ strapi }) {
    const token = process.env.STRAPI_LOCAL_READONLY_TOKEN;
    if (!token) return;

    const name = 'local-dev-readonly';
    // Strapi hache les access keys en HMAC-SHA512 avec admin.apiToken.salt ; on
    // reproduit le même hachage pour que le token en clair envoyé par le site
    // corresponde à la ligne stockée.
    const salt = strapi.config.get('admin.apiToken.salt');
    const accessKey = createHmac('sha512', salt).update(token).digest('hex');

    const existing = await strapi.db
      .query('admin::api-token')
      .findOne({ where: { name } });

    if (existing) {
      if (existing.accessKey !== accessKey) {
        await strapi.db
          .query('admin::api-token')
          .update({ where: { id: existing.id }, data: { accessKey, type: 'read-only' } });
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
  },
};
