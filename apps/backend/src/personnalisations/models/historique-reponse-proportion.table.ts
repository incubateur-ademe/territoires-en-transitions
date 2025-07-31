import { sql } from 'drizzle-orm';
import {
  doublePrecision,
  integer,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { historiqueSchema } from './historique-reponse-choix.table';

export const historiqueReponseProportionTable = historiqueSchema.table(
  'reponse_proportion',
  {
    modifiedAt: timestamp('modified_at', {
      withTimezone: true,
      mode: 'string',
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    collectiviteId: integer('collectivite_id')
      .references(() => collectiviteTable.id)
      .notNull(),
    // TODO: Reference question
    questionId: varchar('question_id', { length: 30 }).notNull(),
    reponse: doublePrecision('reponse'),
    previousReponse: doublePrecision('previous_reponse'),
  }
);
