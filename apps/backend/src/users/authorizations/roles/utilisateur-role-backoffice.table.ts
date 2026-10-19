import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { createdAt, createdBy } from '@tet/backend/utils/column.utils';
import { backofficeRoleEnumValues } from '@tet/domain/users';
import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';

export const utilisateurRoleBackofficeTable = pgTable(
  'utilisateur_role_backoffice',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsersTable.id, { onDelete: 'cascade' }),
    role: text('role', { enum: backofficeRoleEnumValues }).notNull(),
    createdAt,
    createdBy,
  },
  (t) => [primaryKey({ columns: [t.userId, t.role] })]
);
