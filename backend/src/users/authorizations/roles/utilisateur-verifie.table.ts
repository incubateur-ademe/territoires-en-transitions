import { dcpTable } from '@/backend/users/models/dcp.table';
import { boolean, pgTable, uuid } from 'drizzle-orm/pg-core';

export const utilisateurVerifieTable = pgTable('utilisateur_verifie', {
  userId: uuid('user_id')
    .primaryKey()
    .notNull()
    .references(() => dcpTable.userId, { onDelete: 'cascade' }),
  verifie: boolean('verifie').default(false).notNull(),
});
