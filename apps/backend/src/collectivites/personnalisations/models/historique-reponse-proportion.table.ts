import { modifiedAt, modifiedBy } from '@tet/backend/utils/column.utils';
import { doublePrecision, integer, serial, varchar } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../shared/models/collectivite.table';
import { historiqueSchema } from './historique-reponse-choix.table';

export const historiqueReponseProportionTable = historiqueSchema.table(
  'reponse_proportion',
  {
    id: serial('id').primaryKey(),
    modifiedAt,
    modifiedBy,
    collectiviteId: integer('collectivite_id')
      .references(() => collectiviteTable.id)
      .notNull(),
    questionId: varchar('question_id', { length: 30 }).notNull(),
    reponse: doublePrecision('reponse'),
    previousReponse: doublePrecision('previous_reponse'),
  }
);
