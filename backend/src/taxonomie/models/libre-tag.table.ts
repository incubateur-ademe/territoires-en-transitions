import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { createdAt, createdBy } from '../../utils/column.utils';
import { tagTableBase } from './tag.table-base';

export const libreTagTable = pgTable(
  'libre_tag',
  {
    ...tagTableBase,
    createdAt,
    createdBy,
  },
  (table) => {
    return {
      libreTagNomCollectiviteIdKey: uniqueIndex(
        'libre_tag_nom_collectivite_id_key'
      ).on(table.nom, table.collectiviteId),
    };
  }
);

export const libreTagSchema = createSelectSchema(libreTagTable);
