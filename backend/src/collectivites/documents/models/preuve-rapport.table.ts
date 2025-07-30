import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { TIMESTAMP_OPTIONS } from '@/backend/utils/column.utils';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { foreignKey, index, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { DocumentBase } from './document.basetable';

export const preuveRapportTable = pgTable(
  'preuve_rapport',
  {
    ...DocumentBase,
    date: timestamp('date', TIMESTAMP_OPTIONS).notNull(),
  },
  (table) => {
    return {
      idxCollectivite: index('preuve_rapport_idx_collectivite').using(
        'btree',
        table.collectiviteId.asc().nullsLast()
      ),
      preuveCollectiviteId: foreignKey({
        columns: [table.collectiviteId],
        foreignColumns: [collectiviteTable.id],
        name: 'preuve_collectivite_id',
      }),
    };
  }
);

export type PreuveRapportType = InferSelectModel<typeof preuveRapportTable>;
export type CreatePreuveRapportType = InferInsertModel<
  typeof preuveRapportTable
>;

export const preuveRapportSchema = createSelectSchema(preuveRapportTable);
export const createPreuveRapportSchema = createInsertSchema(preuveRapportTable);
