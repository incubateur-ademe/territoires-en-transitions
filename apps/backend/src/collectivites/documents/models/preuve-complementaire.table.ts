import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { foreignKey, index, pgTable, text } from 'drizzle-orm/pg-core';
import { actionRelationTable } from '../../../referentiels/models/action-relation.table';
import { DocumentBase } from './document.basetable';

export const preuveComplementaireTable = pgTable(
  'preuve_complementaire',
  {
    ...DocumentBase,
    actionId: text('action_id')
      .notNull()
      .references(() => actionRelationTable.id),
  },
  (table) => [
    index('preuve_complementaire_idx_collectivite').using(
      'btree',
      table.collectiviteId.asc().nullsLast()
    ),
    foreignKey({
      columns: [table.collectiviteId],
      foreignColumns: [collectiviteTable.id],
      name: 'preuve_collectivite_id',
    }),
    foreignKey({
      columns: [table.actionId],
      foreignColumns: [actionRelationTable.id],
      name: 'preuve_complementaire_action_id_fkey',
    }),
  ]
);
