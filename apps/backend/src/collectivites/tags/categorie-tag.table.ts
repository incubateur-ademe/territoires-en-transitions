import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { boolean, integer, pgTable } from 'drizzle-orm/pg-core';
import { createdAt, createdBy } from '../../utils/column.utils';
import { tagTableBase } from './tag.table-base';

export const categorieTagTable = pgTable('categorie_tag', {
  ...tagTableBase,
  collectiviteId: integer('collectivite_id').references(
    () => collectiviteTable.id
  ),
  groupementId: integer('groupement_id'), // TODO .references(() => groupementTable.id)
  visible: boolean('visible').default(true),
  createdAt,
  createdBy,
});
