import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { integer, pgEnum, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { collectiviteTable } from './collectivite.table';

export const epciNatureEnum = pgEnum('nature', [
  'SMF',
  'CU',
  'CC',
  'SIVOM',
  'POLEM',
  'METRO',
  'SMO',
  'CA',
  'EPT',
  'SIVU',
  'PETR',
]);

export const epciTable = pgTable('epci', {
  id: serial('id').primaryKey(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  nom: varchar('nom', { length: 300 }).notNull(),
  siren: varchar('siren', { length: 9 }).unique().notNull(),
  nature: epciNatureEnum('nature').notNull(),
});
export const epciSchema = createSelectSchema(epciTable);
export const createEpciSchema = createInsertSchema(epciTable);
export type EpciType = InferSelectModel<typeof epciTable>;
export type CreateEpciType = InferInsertModel<typeof epciTable>;
