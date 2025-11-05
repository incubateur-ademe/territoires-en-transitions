import { boolean, integer, text, varchar } from 'drizzle-orm/pg-core';
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
