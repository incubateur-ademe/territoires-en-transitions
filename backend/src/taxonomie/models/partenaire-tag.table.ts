import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { tagTableBase } from './tag.table-base';
import { createSelectSchema } from 'drizzle-zod';

export const partenaireTagTable = pgTable(
  'partenaire_tag',
  tagTableBase,
  (table) => {
    return {
      partenaireTagNomCollectiviteIdKey: uniqueIndex(
        'partenaire_tag_nom_collectivite_id_key'
      ).on(table.nom, table.collectiviteId),
    };
  }
);

export const partenaireTagSchema = createSelectSchema(partenaireTagTable);
