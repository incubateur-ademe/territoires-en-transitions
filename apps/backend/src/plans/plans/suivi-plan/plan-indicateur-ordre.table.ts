import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';

/** L'ordre choisi par la collectivité pour les indicateurs du suivi d'un plan */
export const planIndicateurOrdreTable = pgTable(
  'plan_indicateur_ordre',
  {
    planId: integer('plan_id')
      .notNull()
      .references(() => axeTable.id, { onDelete: 'cascade' }),
    indicateurId: integer('indicateur_id')
      .notNull()
      .references(() => indicateurDefinitionTable.id, { onDelete: 'cascade' }),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    ordre: integer('ordre').notNull(),
  },
  (table) => [primaryKey({ columns: [table.planId, table.indicateurId] })]
);
