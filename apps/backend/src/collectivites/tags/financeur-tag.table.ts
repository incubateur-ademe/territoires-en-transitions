import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { tagTableBase } from './tag.table-base';

export const financeurTagTable = pgTable(
  'financeur_tag',
  {...tagTableBase},
  (table) => [
    uniqueIndex('financeur_tag_nom_collectivite_id_key').on(
      table.nom,
      table.collectiviteId
    ),
  ]
);

export const financeurTagSchema = createSelectSchema(financeurTagTable);
export type FinanceurTag = z.infer<typeof financeurTagSchema>;
