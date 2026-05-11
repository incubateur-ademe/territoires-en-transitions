import { modifiedAt, modifiedBy } from '@tet/backend/utils/column.utils';
import { Lien } from '@tet/domain/collectivites';
import { InferSelectModel } from 'drizzle-orm';
import { integer, jsonb, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../shared/models/collectivite.table';

export const documentBase = {
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
  lien: jsonb('lien').$type<Lien>(),
};

const _baseFields = pgTable('_baseFields', documentBase);
export type DocumentBase = InferSelectModel<typeof _baseFields>;
