import { boolean, integer, pgTable } from 'drizzle-orm/pg-core';
import { tagTableBase } from '../../collectivites/shared/models/tag.table-base';
import { createdAt, createdBy } from '../../utils/column.utils';

export const categorieTagTable = pgTable('categorie_tag', {
  ...tagTableBase,
  groupementId: integer('groupement_id'), // TODO .references(() => groupementTable.id)
  visible: boolean('visible').default(true),
  createdAt,
  createdBy,
});
