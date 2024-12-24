import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { indicateurSourceTable } from './indicateur-source.table';

export const indicateurSourceMetadonneeTable = pgTable(
  'indicateur_source_metadonnee',
  {
    id: serial('id').primaryKey(),
    sourceId: text('source_id')
      .references(() => indicateurSourceTable.id)
      .notNull(),
    dateVersion: timestamp('date_version', { mode: 'string' }).notNull(),
    nomDonnees: text('nom_donnees'),
    diffuseur: text('diffuseur'),
    producteur: text('producteur'),
    methodologie: text('methodologie'),
    limites: text('limites'),
  }
);

export const sourceMetadonneeSchema = createSelectSchema(
  indicateurSourceMetadonneeTable
);

export type SourceMetadonnee = InferSelectModel<
  typeof indicateurSourceMetadonneeTable
>;

export const sourceMetadonneeSchemaInsert = createInsertSchema(
  indicateurSourceMetadonneeTable
);

export type SourceMetadonneeInsert = InferInsertModel<
  typeof indicateurSourceMetadonneeTable
>;
