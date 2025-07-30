import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { foreignKey, index, integer, pgTable } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { auditTable } from '../../../referentiels/labellisations/audit.table';
import { DocumentBase } from './document.basetable';

export const preuveAuditTable = pgTable(
  'preuve_audit',
  {
    ...DocumentBase,
    auditId: integer('audit_id').notNull(),
  },
  (table) => {
    return {
      idxCollectivite: index('preuve_audit_idx_collectivite').using(
        'btree',
        table.collectiviteId.asc().nullsLast()
      ),
      preuveAuditAuditIdFkey: foreignKey({
        columns: [table.auditId],
        foreignColumns: [auditTable.id],
        name: 'preuve_audit_audit_id_fkey',
      }),
      preuveCollectiviteId: foreignKey({
        columns: [table.collectiviteId],
        foreignColumns: [collectiviteTable.id],
        name: 'preuve_collectivite_id',
      }),
    };
  }
);

export type PreuveAuditType = InferSelectModel<typeof preuveAuditTable>;
export type CreatePreuveAuditType = InferInsertModel<typeof preuveAuditTable>;

export const preuveAuditSchema = createSelectSchema(preuveAuditTable);
export const createPreuveAuditSchema = createInsertSchema(preuveAuditTable);
