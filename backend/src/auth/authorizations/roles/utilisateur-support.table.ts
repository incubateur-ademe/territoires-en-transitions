import { dcpTable } from '@/domain/auth';
import { boolean, pgTable, uuid } from 'drizzle-orm/pg-core';

export const utilisateurSupportTable = pgTable('utilisateur_support', {
  userId: uuid('user_id')
    .primaryKey()
    .notNull()
    .references(() => dcpTable.userId, { onDelete: 'cascade' }),
  support: boolean('support').default(false).notNull(),
});
