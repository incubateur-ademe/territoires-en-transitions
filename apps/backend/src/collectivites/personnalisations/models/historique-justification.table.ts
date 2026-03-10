import { sql } from 'drizzle-orm';
import {
  integer,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../shared/models/collectivite.table';
import { historiqueSchema } from './historique-reponse-choix.table';

export const historiqueJustificationTable = historiqueSchema.table(
  'justification',
  {
    id: serial('id').primaryKey(),
    collectiviteId: integer('collectivite_id')
      .references(() => collectiviteTable.id)
      .notNull(),
    questionId: varchar('question_id', { length: 30 }).notNull(),
    modifiedBy: uuid('modified_by'),
    previousModifiedBy: uuid('previous_modified_by'),
    modifiedAt: timestamp('modified_at', {
      withTimezone: true,
      mode: 'string',
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    previousModifiedAt: timestamp('previous_modified_at', {
      withTimezone: true,
      mode: 'string',
    }),
    texte: text('texte').notNull(),
    previousTexte: text('previous_texte'),
  }
);
