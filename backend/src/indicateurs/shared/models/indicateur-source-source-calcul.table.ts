import { indicateurSourceTable } from '@/backend/indicateurs/shared/models/indicateur-source.table';
import { InferSelectModel } from 'drizzle-orm';
import { pgTable, text, unique } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';

export const indicateurSourceSourceCalculTable = pgTable(
  'indicateur_source_source_calcul',
  {
    sourceId: text('source_id')
      .notNull()
      .references(() => indicateurSourceTable.id, { onDelete: 'cascade' }),
    sourceCalculId: text('source_calcul_id')
      .notNull()
      .references(() => indicateurSourceTable.id, { onDelete: 'cascade' }),
  },
  (t) => [unique().on(t.sourceId, t.sourceCalculId)]
);

export const indicateurSourceSourceCalculSchema = createSelectSchema(
  indicateurSourceSourceCalculTable
);

export type IndicateurSourceSourceCalcul = InferSelectModel<
  typeof indicateurSourceSourceCalculTable
>;
