import { authUsersTable } from '@/backend/users/models/auth-users.table';
import { createdAt } from '@/backend/utils/column.utils';
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
