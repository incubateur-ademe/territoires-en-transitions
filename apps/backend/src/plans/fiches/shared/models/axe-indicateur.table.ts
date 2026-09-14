import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { createdAt } from '@tet/backend/utils/column.utils';
import { integer, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { axeTable } from './axe.table';

export const axeIndicateurTable = pgTable(
  'axe_indicateur',
  {
    indicateurId: integer('indicateur_id')
      .notNull()
      .references(() => indicateurDefinitionTable.id, { onDelete: 'cascade' }),
    axeId: integer('axe_id')
      .notNull()
      .references(() => axeTable.id, {
        onDelete: 'cascade',
      }),
    createdAt,
    // Pas de defaut auth.uid() : renseigné obligatoirement par l'application
    // (le backend n'utilise pas la connexion Supabase authentifiée).
    createdBy: uuid('created_by').notNull(),
  },
  (table) => [primaryKey({ columns: [table.indicateurId, table.axeId] })]
);
