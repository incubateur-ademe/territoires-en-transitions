import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { createdAt, createdBy } from '@tet/backend/utils/column.utils';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { demarcheTable } from './demarche.table';

/**
 * Plans d'action rattachés au programme d'actions d'une démarche : une démarche
 * peut en tenir plusieurs. L'exclusivité inverse — un plan n'est tenu que par
 * une seule démarche « en cours » — dépend du statut de la démarche, donc d'une
 * autre table : elle est portée par le trigger `demarche_plan_action_exclusif`
 * (cf. migration) et par le service de rattachement.
 */
export const demarchePlanActionTable = pgTable(
  'demarche_plan_action',
  {
    demarcheId: integer('demarche_id')
      .notNull()
      .references(() => demarcheTable.id, { onDelete: 'cascade' }),
    planActionId: integer('plan_action_id')
      .notNull()
      .references(() => axeTable.id, { onDelete: 'cascade' }),
    createdAt,
    createdBy,
  },
  (table) => [
    primaryKey({ columns: [table.demarcheId, table.planActionId] }),
    index('demarche_plan_action_plan_action_id_idx').on(table.planActionId),
  ]
);

export type DemarchePlanActionRow = InferSelectModel<
  typeof demarchePlanActionTable
>;
export type DemarchePlanActionInsert = InferInsertModel<
  typeof demarchePlanActionTable
>;
