import { modifiedAt } from '@/backend/utils/column.utils';
import { boolean, integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../shared/models/collectivite.table';

export const reponseBinaireTable = pgTable('reponse_binaire', {
  modifiedAt,
  collectiviteId: integer('collectivite_id')
    .references(() => collectiviteTable.id)
    .notNull(),
  // TODO: failed to parse database type 'question_id'
  questionId: varchar('question_id', { length: 30 }).notNull(),
  reponse: boolean('reponse'),
});
