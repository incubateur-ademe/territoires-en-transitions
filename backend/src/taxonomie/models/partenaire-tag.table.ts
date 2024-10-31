import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { TagBase } from './tag.basetable';
import { createSelectSchema } from 'drizzle-zod';

export const partenaireTagTable = pgTable(
  'partenaire_tag',
  TagBase,
  (table) => {
    return {
      partenaireTagNomCollectiviteIdKey: uniqueIndex(
        'partenaire_tag_nom_collectivite_id_key'
      ).on(table.nom, table.collectiviteId),
    };
  }
);

export const partenaireTagSchema = createSelectSchema(partenaireTagTable);
