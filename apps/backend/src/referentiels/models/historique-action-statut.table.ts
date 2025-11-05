import { InferInsertModel, sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { historiqueSchema } from '../../collectivites/personnalisations/models/historique-reponse-choix.table';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { actionIdReference } from './action-relation.table';
import { statutAvancementPgEnum } from './action-statut.table';

export const historiqueActionStatutTable = historiqueSchema.table(
  'action_statut',
  {
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id),
    actionId: actionIdReference.notNull(),
    avancement: statutAvancementPgEnum('avancement').notNull(),
    previousAvancement: statutAvancementPgEnum('previous_avancement'),
    avancementDetaille: doublePrecision('avancement_detaille').array(),
    previousAvancementDetaille: doublePrecision(
      'previous_avancement_detaille'
    ).array(),
    concerne: boolean('concerne').notNull(),
    previousConcerne: boolean('previous_concerne'),
    modifiedBy: uuid('modified_by'),
    previousModifiedBy: uuid('previous_modified_by').default(sql`auth.uid()`),
    modifiedAt: timestamp('modified_at', {
      withTimezone: true,
      mode: 'string',
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    previousModifiedAt: timestamp('previous_modified_at', {
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
  }
);

export type HistoriqueActionStatutInsert = InferInsertModel<
  typeof historiqueActionStatutTable
>;
