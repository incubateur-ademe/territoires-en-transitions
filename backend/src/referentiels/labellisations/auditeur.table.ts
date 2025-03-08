import { authUsersTable } from '@/domain/auth';
import { createdAt } from '@/domain/utils';
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
