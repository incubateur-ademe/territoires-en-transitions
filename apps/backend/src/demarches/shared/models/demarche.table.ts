import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
  TIMESTAMP_OPTIONS,
} from '@tet/backend/utils/column.utils';
import {
  DemarchePcaetObligationEnum,
  DEMARCHE_PCAET_INITIAL_STATUS,
  type DemarchePcaetObligation,
  type DemarchePcaetStatus,
  type DemarcheType,
} from '@tet/domain/demarches';
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Table unique pour tous les types de démarches (héritage par discriminant
 * `type`). Les colonnes typées « pcaet » ci-dessous représentent l'union des
 * valeurs de tous les types — à élargir à chaque nouveau type de démarche.
 */
export const demarcheTable = pgTable(
  'demarche',
  {
    id: serial('id').primaryKey().notNull(),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    type: text('type').notNull().$type<DemarcheType>(),
    titre: text('titre').notNull(),
    description: text('description').notNull().default(''),
    status: text('status')
      .notNull()
      .default(DEMARCHE_PCAET_INITIAL_STATUS)
      .$type<DemarchePcaetStatus>(),
    obligation: text('obligation')
      .notNull()
      .default(DemarchePcaetObligationEnum.OBLIGATOIRE)
      .$type<DemarchePcaetObligation>(),
    launchedAt: timestamp('launched_at', TIMESTAMP_OPTIONS),
    publishedAt: timestamp('published_at', TIMESTAMP_OPTIONS),
    transmittedAt: timestamp('transmitted_at', TIMESTAMP_OPTIONS),
    avisDeadlineAt: timestamp('avis_deadline_at', TIMESTAMP_OPTIONS),
    planActionId: integer('plan_action_id').references(() => axeTable.id, {
      onDelete: 'set null',
    }),
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
  },
  (table) => [
    index('demarche_collectivite_id_idx').on(table.collectiviteId),
    index('demarche_plan_action_id_idx').on(table.planActionId),
    // Une seule démarche « en cours » par collectivité et par type.
    uniqueIndex('demarche_active_unique')
      .on(table.collectiviteId, table.type)
      .where(sql`status IN ('en_elaboration', 'transmis_pour_avis')`),
    // Un plan n'est tenu que par une seule démarche « en cours » (tous types
    // confondus) : une démarche adoptée ou archivée libère son plan.
    uniqueIndex('demarche_plan_action_active_unique')
      .on(table.planActionId)
      .where(
        sql`plan_action_id IS NOT NULL AND status IN ('en_elaboration', 'transmis_pour_avis')`
      ),
  ]
);

export type DemarcheRow = InferSelectModel<typeof demarcheTable>;
export type DemarcheInsert = InferInsertModel<typeof demarcheTable>;
