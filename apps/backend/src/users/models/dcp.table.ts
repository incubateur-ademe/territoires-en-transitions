import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createdAt, modifiedAt } from '../../utils/column.utils';

export const dcpTable = pgTable('dcp', {
  userId: uuid('user_id').primaryKey().notNull(), // TODO .references(() => users.id),
  nom: text('nom').notNull(),
  prenom: text('prenom').notNull(),
  email: text('email').notNull(),
  limited: boolean('limited').default(false).notNull(),
  deleted: boolean('deleted').default(false).notNull(),
  createdAt,
  modifiedAt,
  telephone: varchar('telephone', { length: 30 }),
  cguAccepteesLe: timestamp('cgu_acceptees_le', {
    withTimezone: true,
    mode: 'string',
  }),
});
