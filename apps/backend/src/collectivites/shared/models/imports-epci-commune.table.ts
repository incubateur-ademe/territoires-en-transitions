import { primaryKey, varchar } from 'drizzle-orm/pg-core';
import { departementTable } from './imports-departement.table';
import { importsSchema } from './imports-region.table';

/**
 * Composition communale des EPCI à fiscalité propre d'après BANATIC : une ligne
 * par couple (EPCI, commune membre), sans seuil de population.
 *
 * Matière première des périmètres géographiques secondaires. À ne pas confondre
 * avec `collectivite_relations`, qui dit la même chose mais écarte les communes
 * de moins de 3 000 habitants et ne retient que celles présentes dans
 * `collectivite` — 3 668 relations pour 34 871 lignes de source.
 *
 * Le calcul qui en dérive les périmètres vit en SQL
 * (`imports.update_epci_perimetres_from_banatic()`, change
 * `collectivite/epci_perimetre_secondaire`), pour n'exister qu'à un seul endroit :
 * le seed l'appelle, et le rejeu annuel aussi.
 */
export const epciCommuneTable = importsSchema.table(
  'epci_commune',
  {
    sirenEpci: varchar('siren_epci', { length: 9 }).notNull(),
    inseeCommune: varchar('insee_commune', { length: 5 }).notNull(),
    /** Département de la commune membre. */
    departementCode: varchar('departement_code', { length: 3 })
      .notNull()
      .references(() => departementTable.code),
    /** Département du siège du groupement, répété par la source sur chaque ligne. */
    siegeDepartementCode: varchar('siege_departement_code', { length: 3 })
      .notNull()
      .references(() => departementTable.code),
  },
  (table) => [
    primaryKey({ columns: [table.sirenEpci, table.inseeCommune] }),
  ]
);

export type EpciCommune = typeof epciCommuneTable.$inferSelect;
export type EpciCommuneInsert = typeof epciCommuneTable.$inferInsert;
