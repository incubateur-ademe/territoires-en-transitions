import { authUsersTable } from '@/backend/users/models/auth-users.table';
import { createdAt, modifiedAt } from '@/backend/utils/column.utils';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const userApiKeyTable = pgTable('user_api_key', {
  clientId: text('client_id').primaryKey().notNull(),
  userId: uuid('user_id')
    .references(() => authUsersTable.id)
    .notNull(),
  clientSecretHash: text('client_secret_hash').notNull(),
  clientSecretTruncated: text('client_secret_truncated').notNull(),
  permissions: text('permissions').array(),
  // TODO expirationDate: timestamp('expiration_date', { withTimezone: true }),
  createdAt: createdAt,
  modifiedAt: modifiedAt,
});
