import { modifiedAt } from '@tet/backend/utils/column.utils';
import { integer, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../shared/models/collectivite.table';
import { questionChoixTable } from './question-choix.table';
import { questionTable } from './question.table';

export const reponseChoixTable = pgTable(
  'reponse_choix',
  {
    modifiedAt,
    collectiviteId: integer('collectivite_id')
      .references(() => collectiviteTable.id)
      .notNull(),
    questionId: varchar('question_id', { length: 30 })
      .references(() => questionTable.id)
      .notNull(),
    reponse: varchar('reponse', { length: 30 }).references(
      () => questionChoixTable.id
    ),
  },
  (table) => [primaryKey({ columns: [table.collectiviteId, table.questionId] })]
);
