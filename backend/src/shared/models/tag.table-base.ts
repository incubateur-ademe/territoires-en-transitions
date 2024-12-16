import { integer, serial, text } from 'drizzle-orm/pg-core';
import z from 'zod';
import { collectiviteTable } from '../../collectivites/models/collectivite.table';

export const tagTableBase = {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
};

export const tagSchema = z.object({
  id: z.number(),
  nom: z.string(),
  collectiviteId: z.number(),
});

export type Tag = z.infer<typeof tagSchema>;
