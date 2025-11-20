import { modifiedAt } from '@tet/backend/utils/column.utils';
import {
  doublePrecision,
  integer,
  pgTable,
  varchar,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../shared/models/collectivite.table';

export const reponseProportionTable = pgTable('reponse_proportion', {
  modifiedAt,
  collectiviteId: integer('collectivite_id')
    .references(() => collectiviteTable.id)
    .notNull(),
  // TODO: Reference question
  questionId: varchar('question_id', { length: 30 }).notNull(),
  reponse: doublePrecision('reponse'),
});
