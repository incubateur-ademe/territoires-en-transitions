import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { levierGesIdPgEnum } from '@tet/backend/collectivites/shared/models/levier-ges-id.column';
import { voletCategoriePgEnum } from '@tet/backend/collectivites/shared/models/volet-categorie.column';
import { createdAt } from '@tet/backend/utils/column.utils';
import { integer, pgTable, primaryKey, smallint } from 'drizzle-orm/pg-core';

export const collectiviteVoletGesTable = pgTable(
  'collectivite_volet_ges',
  {
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    levierId: levierGesIdPgEnum('levier_id').notNull(),
    categorie: voletCategoriePgEnum('categorie').notNull(),
    note: smallint('note').notNull(),
    ficheIds: integer('fiche_ids').array().notNull().default([]),
    createdAt,
  },
  (table) => [
    primaryKey({
      columns: [table.collectiviteId, table.levierId, table.categorie],
    }),
  ]
);
