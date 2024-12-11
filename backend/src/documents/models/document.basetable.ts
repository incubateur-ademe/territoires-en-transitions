import { TIMESTAMP_OPTIONS } from '@/backend/common/models/column.helpers';
import {
  integer,
  jsonb,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/models/collectivite.table';

export const DocumentBase = {
  id: serial('id').primaryKey(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  fichierId: integer('fichier_id'), // reference indirectement labellisation.bibliotheque_fichier
  url: text('url'),
  titre: text('titre'),
  commentaire: text('commentaire'),
  modifiedAt: timestamp('modified_at', TIMESTAMP_OPTIONS)
    .notNull()
    .defaultNow(),
  modifiedBy: uuid('modified_by'), // TODO references auth.uid,
  lien: jsonb('lien'),
};
