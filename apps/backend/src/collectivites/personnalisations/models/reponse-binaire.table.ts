import { modifiedAt } from '@tet/backend/utils/column.utils';
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  varchar,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../shared/models/collectivite.table';
import { questionTable } from './question.table';

export const reponseBinaireTable = pgTable(
  'reponse_binaire',
  {
    modifiedAt,
    collectiviteId: integer('collectivite_id')
      .references(() => collectiviteTable.id)
      .notNull(),
    questionId: varchar('question_id', { length: 30 })
      .references(() => questionTable.id)
      .notNull(),
    reponse: boolean('reponse'),
  },
  (table) => [primaryKey({ columns: [table.collectiviteId, table.questionId] })]
);
