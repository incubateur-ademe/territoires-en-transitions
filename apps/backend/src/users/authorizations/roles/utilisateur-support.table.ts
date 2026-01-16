import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { boolean, pgTable, uuid } from 'drizzle-orm/pg-core';

export const utilisateurSupportTable = pgTable('utilisateur_support', {
  userId: uuid('user_id')
    .primaryKey()
    .notNull()
    .references(() => dcpTable.id, { onDelete: 'cascade' }),
  isSupport: boolean('support').default(false).notNull(),
  isSuperAdminRoleEnabled: boolean('is_support_mode_enabled')
    .default(false)
    .notNull(),
});
