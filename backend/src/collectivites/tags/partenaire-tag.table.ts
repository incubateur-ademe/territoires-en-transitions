import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { tagTableBase } from './tag.table-base';

export const partenaireTagTable = pgTable(
  'partenaire_tag',
  {...tagTableBase},
  (table) => [
    uniqueIndex('partenaire_tag_nom_collectivite_id_key').on(
      table.nom,
      table.collectiviteId
    ),
  ]
);

export const partenaireTagSchema = createSelectSchema(partenaireTagTable);
