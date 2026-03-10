import { modifiedAt, modifiedBy } from '@tet/backend/utils/column.utils';
import { integer, pgSchema, serial, varchar } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../shared/models/collectivite.table';

export const historiqueSchema = pgSchema('historique');
export const historiqueReponseChoixTable = historiqueSchema.table(
  'reponse_choix',
  {
    id: serial('id').primaryKey(),
    modifiedAt,
    modifiedBy,
    collectiviteId: integer('collectivite_id')
      .references(() => collectiviteTable.id)
      .notNull(),
    questionId: varchar('question_id', { length: 30 }).notNull(),
    reponse: varchar('reponse', { length: 30 }),
    previousReponse: varchar('previous_reponse', { length: 30 }),
  }
);
