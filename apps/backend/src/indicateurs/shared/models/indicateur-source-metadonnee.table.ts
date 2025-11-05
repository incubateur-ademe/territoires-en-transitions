import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
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
