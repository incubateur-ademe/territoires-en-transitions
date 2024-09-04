import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { collectiviteTable } from '../../collectivites/models/collectivite.models';
import { historiqueSchema } from '../../personnalisations/models/historique-reponse-choix.table';
import { actionIdReference } from './action-definition.table';
import { avancementEnum } from './action-statut.table';

export const historiqueActionStatutTable = historiqueSchema.table(
  'action_statut',
  {
    collectivite_id: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id),
    action_id: actionIdReference.notNull(),
    avancement: avancementEnum('avancement').notNull(),
    previous_avancement: avancementEnum('previous_avancement'),
    avancement_detaille: doublePrecision('avancement_detaille').array(),
    previous_avancement_detaille: doublePrecision(
      'previous_avancement_detaille',
    ).array(),
    concerne: boolean('concerne').notNull(),
    previous_concerne: boolean('previous_concerne').notNull(),
    modified_by: uuid('modified_by')
      .default(sql`auth.uid()`)
      .notNull(),
    previous_modified_by: uuid('previous_modified_by').default(sql`auth.uid()`),
    modified_at: timestamp('modified_at', {
      withTimezone: true,
      mode: 'string',
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    previous_modified_at: timestamp('previous_modified_at', {
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
  },
);

export type HistoriqueActionStatutType = InferSelectModel<
  typeof historiqueActionStatutTable
>;
export type CreateHistoriqueActionStatutTypeType = InferInsertModel<
  typeof historiqueActionStatutTable
>;

export const historiqueActionStatutSchema = createSelectSchema(
  historiqueActionStatutTable,
);
export const createHistoriqueActionStatutSchema = createInsertSchema(
  historiqueActionStatutTable,
);
