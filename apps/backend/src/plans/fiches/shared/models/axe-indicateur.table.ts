import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
} from '@tet/backend/utils/column.utils';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
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
    createdBy,
    modifiedAt,
    modifiedBy,
  },
  (table) => [primaryKey({ columns: [table.indicateurId, table.axeId] })]
);
