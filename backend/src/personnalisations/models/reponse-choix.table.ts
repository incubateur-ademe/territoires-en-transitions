import { modifiedAt } from '@/backend/utils/index-domain';
import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';

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
