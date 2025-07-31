import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';

export const thematiqueTable = pgTable('thematique', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  mdId: varchar('md_id'),
});

export type CreateThematiqueType = InferInsertModel<typeof thematiqueTable>;

export type ThematiqueAvecAncienIdentifiantType = InferSelectModel<
  typeof thematiqueTable
>;
export const thematiqueAvecAncienIdentifiantSchema =
  createSelectSchema(thematiqueTable);

export const thematiqueSchema = thematiqueAvecAncienIdentifiantSchema.pick({
  id: true,
  nom: true,
});

export type Thematique = z.infer<typeof thematiqueSchema>;
