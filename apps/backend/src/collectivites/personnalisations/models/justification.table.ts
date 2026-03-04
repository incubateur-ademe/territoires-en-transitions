import { modifiedAt, modifiedBy } from '@tet/backend/utils/column.utils';
import {
  integer,
  pgTable,
  primaryKey,
  text,
  varchar,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../shared/models/collectivite.table';

export const justificationTable = pgTable(
  'justification',
  {
    collectiviteId: integer('collectivite_id')
      .references(() => collectiviteTable.id)
      .notNull(),
    questionId: varchar('question_id', { length: 30 }).notNull(),
    modifiedAt,
    modifiedBy,
    texte: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.collectiviteId, table.questionId] })]
);
