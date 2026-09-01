import { integer, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { collectiviteTable } from './collectivite.table';

/**
 * Périmètre Banatic 2025 d'un EPCI : nombre de communes membres (snapshot).
 *
 * Sert de dénominateur pour inférer une délégation totale d'une compétence :
 * `nb_communes_transferees >= nb_communes_membres` (cf. plan 2026-06-30-001).
 * Source : fichier data.gouv « base nationale sur les intercommunalités »,
 * comptage NON filtré par population.
 */
export const collectiviteBanatic2025PerimetreTable = pgTable(
  'collectivite_banatic_2025_perimetre',
  {
    collectiviteId: integer('collectivite_id')
      .primaryKey()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    nbCommunesMembres: integer('nb_communes_membres').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  }
);
