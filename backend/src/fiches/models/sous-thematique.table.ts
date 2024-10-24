import { InferInsertModel } from 'drizzle-orm';
import { integer, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { thematiqueTable } from './thematique.table';

export const sousThematiqueTable = pgTable('thematique', {
  id: serial('id').primaryKey(),
  sous_thematique: text('sous_thematique').notNull(),
  thematique_id: integer('thematique_id').references(() => thematiqueTable.id),
});
export type CreateSousThematiqueType = InferInsertModel<
  typeof sousThematiqueTable
>;

export const sousThematiqueSchema = createSelectSchema(sousThematiqueTable);
