import { modifiedAt } from '@tet/backend/utils/column.utils';
import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../shared/models/collectivite.table';

export const reponseChoixTable = pgTable('reponse_choix', {
  modifiedAt,
  collectiviteId: integer('collectivite_id')
    .references(() => collectiviteTable.id)
    .notNull(),
  // TODO: Reference question
  questionId: varchar('question_id', { length: 30 }).notNull(),
  // TODO: Reference choix_id
  reponse: varchar('reponse', { length: 30 }),
});
