import { sql } from 'drizzle-orm';
import {
  doublePrecision,
  integer,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/models/collectivite.models';
import { historiqueSchema } from './historique-reponse-choix.table';

export const historiqueReponseProportionTable = historiqueSchema.table(
  'reponse_proportion',
  {
    modified_at: timestamp('modified_at', {
      withTimezone: true,
      mode: 'string',
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    collectivite_id: integer('collectivite_id')
      .references(() => collectiviteTable.id)
      .notNull(),
    // TODO: Reference question
    question_id: varchar('question_id', { length: 30 }).notNull(),
    reponse: doublePrecision('reponse'),
    previous_reponse: doublePrecision('previous_reponse'),
  },
);
