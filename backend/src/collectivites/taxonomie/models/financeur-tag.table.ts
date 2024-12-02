import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { tagTableBase } from './tag.table-base';
import { createSelectSchema } from 'drizzle-zod';

export const financeurTagTable = pgTable(
  'financeur_tag',
  tagTableBase,
  (table) => {
    return {
      financeurTagNomCollectiviteIdKey: uniqueIndex(
        'financeur_tag_nom_collectivite_id_key'
      ).on(table.nom, table.collectiviteId),
    };
  }
);

export const financeurTagSchema = createSelectSchema(financeurTagTable);
