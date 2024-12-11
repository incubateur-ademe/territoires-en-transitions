import { boolean, integer, pgTable } from 'drizzle-orm/pg-core';
import { createdAt, createdBy } from '../../common/models/column.helpers';
import { tagTableBase } from './tag.table-base';

export const categorieTagTable = pgTable('categorie_tag', {
  ...tagTableBase,
  groupementId: integer('groupement_id'), // TODO .references(() => groupementTable.id)
  visible: boolean('visible').default(true),
  createdAt,
  createdBy,
});
