import {
  boolean,
  integer,
  serial,
  text,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { labellisationSchema } from '../../../referentiels/labellisations/labellisation.schema';
import { collectiviteTable } from '../../shared/models/collectivite.table';

export const bibliothequeFichierTable = labellisationSchema.table(
  'bibliotheque_fichier',
  {
    id: serial('id'),
    collectiviteId: integer('collectivite_id').references(
      () => collectiviteTable.id
    ),
    hash: varchar('hash', { length: 160 }),
    filename: text('filename'),
    confidentiel: boolean('confidentiel'),
  },
  (table) => [
    unique('bibliotheque_fichier_collectivite_id_hash_key').on(
      table.collectiviteId,
      table.hash
    ),
  ]
);
