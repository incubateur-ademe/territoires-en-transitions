import {
  boolean,
  foreignKey,
  integer,
  serial,
  text,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { labellisationSchema } from './labellisation.schema';

export const labellisationBibliothequeFichierTable = labellisationSchema.table(
  'bibliotheque_fichier',
  {
    id: serial('id').primaryKey().notNull(),
    collectiviteId: integer('collectivite_id'),
    hash: varchar('hash', { length: 160 }),
    filename: text('filename'),
    confidentiel: boolean('confidentiel').default(false).notNull(),
  },
  (table) => {
    return {
      bibliothequeFichierCollectiviteIdFkey: foreignKey({
        columns: [table.collectiviteId],
        foreignColumns: [collectiviteTable.id],
        name: 'bibliotheque_fichier_collectivite_id_fkey',
      }),
      bibliothequeFichierCollectiviteIdHashKey: unique(
        'bibliotheque_fichier_collectivite_id_hash_key'
      ).on(table.collectiviteId, table.hash),
    };
  }
);

export type LabellisationBibliothequeFichier =
  typeof labellisationBibliothequeFichierTable.$inferSelect;

export const labellisationBibliothequeFichierSchema = createSelectSchema(
  labellisationBibliothequeFichierTable
);
