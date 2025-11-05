import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { foreignKey, index, integer, pgTable } from 'drizzle-orm/pg-core';
import { auditTable } from '../../../referentiels/labellisations/audit.table';
import { DocumentBase } from './document.basetable';

export const preuveAuditTable = pgTable(
  'preuve_audit',
  {
    ...DocumentBase,
    auditId: integer('audit_id').notNull(),
  },
  (table) => [
    index('preuve_audit_idx_collectivite').using(
      'btree',
      table.collectiviteId.asc().nullsLast()
    ),
    foreignKey({
      columns: [table.auditId],
      foreignColumns: [auditTable.id],
      name: 'preuve_audit_audit_id_fkey',
    }),
    foreignKey({
      columns: [table.collectiviteId],
      foreignColumns: [collectiviteTable.id],
      name: 'preuve_collectivite_id',
    }),
  ]
);
