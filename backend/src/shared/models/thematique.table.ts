import { InferSelectModel } from 'drizzle-orm';
import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';

export const thematiqueTable = pgTable('thematique', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  mdId: varchar('md_id'),
});

export type ThematiqueAvecAncienIdentifiantType = InferSelectModel<
  typeof thematiqueTable
>;
export const thematiqueAvecAncienIdentifiantSchema =
  createSelectSchema(thematiqueTable);

export type ThematiqueType = Omit<ThematiqueAvecAncienIdentifiantType, 'mdId'>;

export const thematiqueSchema = thematiqueAvecAncienIdentifiantSchema.pick({
  id: true,
  nom: true,
});

export type Thematique = z.infer<typeof thematiqueSchema>;
