import { sql } from 'drizzle-orm';
import { boolean, integer, timestamp, varchar } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { historiqueSchema } from './historique-reponse-choix.table';

export const historiqueReponseBinaireTable = historiqueSchema.table(
  'reponse_binaire',
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
    // TODO: failed to parse database type 'question_id'
    questionId: varchar('question_id', { length: 30 }).notNull(),
    reponse: boolean('reponse'),
    previousReponse: boolean('previous_reponse'),
  }
);
