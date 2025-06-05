import { authUsersTable } from '@/backend/users/index-domain';
import { createdAt } from '@/backend/utils/index-domain';
import { integer, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { auditTable } from './audit.table';

export const auditeurTable = pgTable(
  'audit_auditeur',
  {
    auditId: integer('audit_id')
      .notNull()
      .references(() => auditTable.id),

    auditeur: uuid('auditeur')
      .notNull()
      .references(() => authUsersTable.id),

    createdAt,
  },
  (table) => [
    primaryKey({
      name: 'audit_auditeur_pkey',
      columns: [table.auditId, table.auditeur],
    }),
  ]
);
