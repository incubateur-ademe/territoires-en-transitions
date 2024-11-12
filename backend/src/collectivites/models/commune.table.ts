import { integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { collectiviteTable } from './collectivite.table';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const communeTable = pgTable('commune', {
  id: serial('id').primaryKey(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  nom: varchar('nom', { length: 300 }).notNull(),
  code: varchar('code', { length: 5 }).unique().notNull(), // TODO: domain codegeo
});
export const communeSchema = createSelectSchema(communeTable);
export const createCommuneSchema = createInsertSchema(communeTable);
export type CommuneType = InferSelectModel<typeof communeTable>;
export type CreateCommuneType = InferInsertModel<typeof communeTable>;
