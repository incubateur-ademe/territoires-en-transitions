import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { indicateurSourceTable } from './indicateur-source.table';

export const indicateurSourceMetadonneeTable = pgTable(
  'indicateur_source_metadonnee',
  {
    id: serial('id').primaryKey(),
    sourceId: text('source_id')
      .references(() => indicateurSourceTable.id)
      .notNull(),
    dateVersion: timestamp('date_version').notNull(),
    nomDonnees: text('nom_donnees'),
    diffuseur: text('diffuseur'),
    producteur: text('producteur'),
    methodologie: text('methodologie'),
    limites: text('limites'),
  },
);
export type IndicateurSourceMetadonneeType = InferSelectModel<
  typeof indicateurSourceMetadonneeTable
>;
export type CreateIndicateurSourceMetadonneeType = InferInsertModel<
  typeof indicateurSourceMetadonneeTable
>;
export const indicateurSourceMetadonneeSchema = createSelectSchema(
  indicateurSourceMetadonneeTable,
);
export const createIndicateurSourceMetadonneeSchema = createInsertSchema(
  indicateurSourceMetadonneeTable,
);
