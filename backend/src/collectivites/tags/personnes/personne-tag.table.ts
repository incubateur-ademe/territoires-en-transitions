import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { tagTableBase } from '../tag.table-base';

export const personneTagTable = pgTable(
  'personne_tag',
  {...tagTableBase},
  (table) => [
    uniqueIndex(
        'personne_tag_nom_collectivite_id_key'
      ).on(table.nom, table.collectiviteId),
    ]
);

export const personneTagSchema = createSelectSchema(personneTagTable);
export type PersonneTag = z.infer<typeof personneTagSchema>;
