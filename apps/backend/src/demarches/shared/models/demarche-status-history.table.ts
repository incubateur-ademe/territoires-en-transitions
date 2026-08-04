import { createdAt, createdBy } from '@tet/backend/utils/column.utils';
import type {
  DemarchePcaetStatus,
  DemarchePcaetTransition,
} from '@tet/domain/demarches';
import { InferInsertModel } from 'drizzle-orm';
import { index, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { demarcheTable } from './demarche.table';

/**
 * Journal des transitions, tous types de démarches confondus : les statuts et
 * transitions typés « pcaet » représentent l'union des valeurs de tous les
 * types — à élargir à chaque nouveau type de démarche.
 */
export const demarcheStatusHistoryTable = pgTable(
  'demarche_status_history',
  {
    id: serial('id').primaryKey().notNull(),
    demarcheId: integer('demarche_id')
      .references(() => demarcheTable.id, { onDelete: 'cascade' })
      .notNull(),
    fromStatus: text('from_status').$type<DemarchePcaetStatus>(),
    toStatus: text('to_status').notNull().$type<DemarchePcaetStatus>(),
    transition: text('transition').notNull().$type<DemarchePcaetTransition>(),
    createdAt,
    createdBy,
  },
  (table) => [
    index('demarche_status_history_demarche_id_idx').on(table.demarcheId),
  ]
);

export type DemarcheStatusHistoryInsert = InferInsertModel<
  typeof demarcheStatusHistoryTable
>;
