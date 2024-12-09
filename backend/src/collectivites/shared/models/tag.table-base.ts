import { integer, serial, text } from 'drizzle-orm/pg-core';
import { collectiviteTable } from './collectivite.table';

export const tagTableBase = {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
};

export type TagType = {
  id: number;
  nom: string;
  collectiviteId: number;
};
