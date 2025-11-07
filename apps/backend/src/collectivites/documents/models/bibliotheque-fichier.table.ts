import { InferSelectModel } from 'drizzle-orm';
import { boolean, integer, serial, text, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { labellisationSchema } from '../../../referentiels/labellisations/labellisation.schema';

export const bibliothequeFichierTable = labellisationSchema.table(
  'bibliotheque_fichier',
  {
    id: serial('id'),
    collectiviteId: integer('collectivite_id'), // TODO: must reference collectiviteTable, not understanding why not
    hash: varchar('hash', { length: 160 }),
    filename: text('filename'),
    confidentiel: boolean('confidentiel'),
  }
);

export type BibliothequeFichier = InferSelectModel<
  typeof bibliothequeFichierTable
>;

export const bibliothequeFichierSchema = createSelectSchema(
  bibliothequeFichierTable
);
export const createBibliothequeFichierSchema = createInsertSchema(
  bibliothequeFichierTable
).extend({
  collectiviteId: z.number().int().positive(),
  hash: z.string().min(1),
  filename: z.string().min(1),
});

export type CreateBibliothequeFichier = z.infer<
  typeof createBibliothequeFichierSchema
>;
