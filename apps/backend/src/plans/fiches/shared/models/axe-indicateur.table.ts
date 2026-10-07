import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { axeTable } from './axe.table';
import { relationAuditColumns } from './relation-audit.column';

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
    ...relationAuditColumns,
  },
  (table) => [primaryKey({ columns: [table.indicateurId, table.axeId] })]
);
