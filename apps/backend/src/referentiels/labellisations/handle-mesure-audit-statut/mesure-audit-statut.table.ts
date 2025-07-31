import { modifiedAt } from '@/backend/utils/column.utils';
import { sql } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  integer,
  pgEnum,
  serial,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { collectiviteTable } from '../../../collectivites/shared/models/collectivite.table';
import { authUsersTable } from '../../../users/models/auth-users.table';
import { actionIdReference } from '../../models/action-relation.table';
import { auditTable } from '../audit.table';
import { labellisationSchema } from '../labellisation.schema';

export const MesureAuditStatutEnum = {
  NON_AUDITE: 'non_audite',
  EN_COURS: 'en_cours',
  AUDITE: 'audite',
} as const;

const auditStatutPgEnum = pgEnum('audit_statut', [
  MesureAuditStatutEnum.NON_AUDITE,
  MesureAuditStatutEnum.EN_COURS,
  MesureAuditStatutEnum.AUDITE,
]);

export const mesureAuditStatutTable = labellisationSchema.table(
  'action_audit_state',
  {
    id: serial('id').primaryKey().notNull(),
    auditId: integer('audit_id'),
    mesureId: actionIdReference.notNull(),
    collectiviteId: integer('collectivite_id').notNull(),
    modifiedBy: uuid('modified_by')
      .default(sql`auth.uid()`)
      .notNull(),
    modifiedAt,
    ordreDuJour: boolean('ordre_du_jour').default(false).notNull(),
    avis: text('avis').default('').notNull(),
    statut: auditStatutPgEnum('statut').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.auditId],
      foreignColumns: [auditTable.id],
      name: 'action_audit_state_audit_id_fkey',
    }),
    foreignKey({
      columns: [table.collectiviteId],
      foreignColumns: [collectiviteTable.id],
      name: 'action_audit_state_collectivite_id_fkey',
    }),
    foreignKey({
      columns: [table.modifiedBy],
      foreignColumns: [authUsersTable.id],
      name: 'action_audit_state_modified_by_fkey',
    }),
    unique('action_audit').on(table.auditId, table.mesureId),
  ]
);

export type MesureAuditStatut = typeof mesureAuditStatutTable.$inferSelect;

export const mesureAuditStatutSchema = createSelectSchema(
  mesureAuditStatutTable
);

export const mesureAuditStatutInsertSchema = createInsertSchema(
  mesureAuditStatutTable
);
