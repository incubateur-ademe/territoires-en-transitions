import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { createdAt } from '@tet/backend/utils/column.utils';
import { integer, pgTable, primaryKey, smallint } from 'drizzle-orm/pg-core';
import {
  levierGesIdEnum,
  voletCategorieEnum,
} from './fiche-action-volet-ges.table';

export const collectiviteVoletGesTable = pgTable(
  'collectivite_volet_ges',
  {
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    levierId: levierGesIdEnum('levier_id').notNull(),
    categorie: voletCategorieEnum('categorie').notNull(),
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
