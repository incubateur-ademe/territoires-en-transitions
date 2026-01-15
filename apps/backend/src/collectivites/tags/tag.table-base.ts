import { integer, serial, text } from 'drizzle-orm/pg-core';
import { createdAt, createdBy } from '../../utils/column.utils';
import { collectiviteTable } from '../shared/models/collectivite.table';

export const tagTableBase = {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  createdAt,
  createdBy,
};
