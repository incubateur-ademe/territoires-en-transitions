import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { boolean, integer, text, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { labellisationSchema } from '../../../referentiels/labellisations/labellisation.schema';

export const bibliothequeFichierTable = labellisationSchema.table(
  'bibliotheque_fichier',
  {
    id: integer('id'),
    collectiviteId: integer('collectivite_id'), // TODO: must reference collectiviteTable, not understanding why not
    hash: varchar('hash', { length: 160 }),
    filename: text('filename'),
    confidentiel: boolean('confidentiel'),
  }
);

export type BibliothequeFichierType = InferSelectModel<
  typeof bibliothequeFichierTable
>;
export type CreateBibliothequeFichierType = InferInsertModel<
  typeof bibliothequeFichierTable
>;

export const bibliothequeFichierSchema = createSelectSchema(
  bibliothequeFichierTable
);
export const createBibliothequeFichierSchema = createInsertSchema(
  bibliothequeFichierTable
);
