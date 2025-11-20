import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { TIMESTAMP_OPTIONS } from '@tet/backend/utils/column.utils';
import { foreignKey, index, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { DocumentBase } from './document.basetable';

export const preuveRapportTable = pgTable(
  'preuve_rapport',
  {
    ...DocumentBase,
    date: timestamp('date', TIMESTAMP_OPTIONS).notNull(),
  },
  (table) => [
    index('preuve_rapport_idx_collectivite').using(
      'btree',
      table.collectiviteId.asc().nullsLast()
    ),
    foreignKey({
      columns: [table.collectiviteId],
      foreignColumns: [collectiviteTable.id],
      name: 'preuve_collectivite_id',
    }),
  ]
);
