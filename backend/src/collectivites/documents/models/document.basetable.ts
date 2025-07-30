import { modifiedAt, modifiedBy } from '@/backend/utils/column.utils';
import { integer, jsonb, serial, text } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../shared/models/collectivite.table';

export const DocumentBase = {
  id: serial('id').primaryKey(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  fichierId: integer('fichier_id'), // reference indirectement labellisation.bibliotheque_fichier
  url: text('url'),
  titre: text('titre'),
  commentaire: text('commentaire'),
  modifiedAt,
  modifiedBy,
  lien: jsonb('lien'),
};
