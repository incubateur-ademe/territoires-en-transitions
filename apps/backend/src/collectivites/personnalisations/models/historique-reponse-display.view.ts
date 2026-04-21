import { integer, jsonb, pgSchema, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

const historiqueSchema = pgSchema('historique');

/**
 * Vue `historique.reponse_display` : union des 3 types de réponses (binaire,
 * choix, proportion) avec leur `question_type`, encodée en jsonb pour être
 * manipulable uniformément.
 *
 * Définie dans `data_layer/sqitch/deploy/evaluation/reponse_historique.sql`.
 */
export const historiqueReponseDisplayView = historiqueSchema
  .view('reponse_display', {
    questionType: varchar('question_type', { length: 30 }).notNull(),
    collectiviteId: integer('collectivite_id').notNull(),
    questionId: varchar('question_id', { length: 30 }).notNull(),
    reponse: jsonb('reponse'),
    previousReponse: jsonb('previous_reponse'),
    modifiedAt: timestamp('modified_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    previousModifiedAt: timestamp('previous_modified_at', {
      withTimezone: true,
      mode: 'string',
    }),
    modifiedBy: uuid('modified_by'),
    previousModifiedBy: uuid('previous_modified_by'),
  })
  .existing();
