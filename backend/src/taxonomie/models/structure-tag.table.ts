import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { tagTableBase } from './tag.table-base';
import { createSelectSchema } from 'drizzle-zod';

export const structureTagTable = pgTable(
  'structure_tag',
  tagTableBase,
  (table) => {
    return {
      structureTagNomCollectiviteIdKey: uniqueIndex(
        'structure_tag_nom_collectivite_id_key'
      ).on(table.nom, table.collectiviteId),
    };
  }
);

export const structureTagSchema = createSelectSchema(structureTagTable);
