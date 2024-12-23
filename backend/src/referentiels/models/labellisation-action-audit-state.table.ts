import { modifiedAt } from '@/backend/utils';
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
import { authUsersTable } from '../../auth/models/auth-users.table';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { actionIdReference } from './action-definition.table';
import { labellisationAuditTable } from './labellisation-audit.table';
import { labellisationSchema } from './labellisation.schema';

export enum AuditStatutEnumType {
  NON_AUDITE = 'non_audite',
  EN_COURS = 'en_cours',
  AUDITE = 'audite',
}
export const auditStatutEnum = pgEnum('audit_statut', [
  AuditStatutEnumType.NON_AUDITE,
  AuditStatutEnumType.EN_COURS,
  AuditStatutEnumType.AUDITE,
]);

export const labellisationActionAuditStateTable = labellisationSchema.table(
  'action_audit_state',
  {
    id: serial('id').primaryKey().notNull(),
    auditId: integer('audit_id'),
    actionId: actionIdReference.notNull(),
    collectiviteId: integer('collectivite_id').notNull(),
    modifiedBy: uuid('modified_by')
      .default(sql`auth.uid()`)
      .notNull(),
    modifiedAt,
    ordreDuJour: boolean('ordre_du_jour').default(false).notNull(),
    avis: text('avis').default('').notNull(),
    statut: auditStatutEnum('statut').notNull(),
  },
  (table) => {
    return {
      actionAuditStateAuditIdFkey: foreignKey({
        columns: [table.auditId],
        foreignColumns: [labellisationAuditTable.id],
        name: 'action_audit_state_audit_id_fkey',
      }),
      actionAuditStateCollectiviteIdFkey: foreignKey({
        columns: [table.collectiviteId],
        foreignColumns: [collectiviteTable.id],
        name: 'action_audit_state_collectivite_id_fkey',
      }),
      actionAuditStateModifiedByFkey: foreignKey({
        columns: [table.modifiedBy],
        foreignColumns: [authUsersTable.id],
        name: 'action_audit_state_modified_by_fkey',
      }),
      actionAudit: unique('action_audit').on(table.auditId, table.actionId),
    };
  }
);
