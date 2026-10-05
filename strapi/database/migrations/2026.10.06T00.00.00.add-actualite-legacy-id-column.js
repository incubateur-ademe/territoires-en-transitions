'use strict';

/**
 * Crée la colonne `legacy_id` des actualités avant les migrations internes de
 * Strapi 5.
 *
 * Strapi joue nos migrations, puis les siennes, puis seulement synchronise le
 * schéma. Sa migration `5.0.0-discard-drafts` copie les lignes publiées en
 * brouillons en listant les colonnes du schéma du code : `legacy_id` y figure
 * déjà alors que la synchronisation ne l'a pas encore ajoutée en base, et la
 * migration échoue en boucle. Créée ici, la colonne existe à temps ; la
 * synchronisation la retrouve ensuite telle qu'attendue.
 */
module.exports = {
  async up(knex) {
    // Base neuve : la table n'existe qu'après la synchronisation du schéma.
    if (!(await knex.schema.hasTable('actualites'))) return;
    if (await knex.schema.hasColumn('actualites', 'legacy_id')) return;

    await knex.schema.alterTable('actualites', (table) => {
      table.integer('legacy_id');
    });
  },
};
