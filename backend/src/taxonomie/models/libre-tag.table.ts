import { sql } from 'drizzle-orm';
import { pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { tagTableBase } from './tag.table-base';
import { createSelectSchema } from 'drizzle-zod';

export const libreTagTable = pgTable(
  'libre_tag',
  {
    ...tagTableBase,

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid('created_by').default(sql`auth.uid()`),
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
