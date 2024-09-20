import { boolean, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { text, timestamp } from 'drizzle-orm/pg-core';

export const dcpTable = pgTable('dcp', {
  userId: uuid('user_id').primaryKey().notNull(), // TODO .references(() => users.id),
  nom: text('nom').notNull(),
  prenom: text('prenom').notNull(),
  email: text('email').notNull(),
  limited: boolean('limited').default(false).notNull(),
  deleted: boolean('deleted').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  modifiedAt: timestamp('modified_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  telephone: varchar('telephone', { length: 30 }),
  cguAccepteesLe: timestamp('cgu_acceptees_le', {
    withTimezone: true,
    mode: 'string',
  }),
});
