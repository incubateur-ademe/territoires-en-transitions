import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import { boolean, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// TODO: create domain siren as varchar(9) check ( value ~ '^\d{9}$' );
// TODO: create domain codegeo as varchar(5);

export const collectiviteTable = pgTable('collectivite', {
  id: serial('id').primaryKey(),
  modifiedAt: timestamp('modified_at', { withTimezone: true })
    .default(sql.raw(`CURRENT_TIMESTAMP`))
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql.raw(`CURRENT_TIMESTAMP`))
    .notNull(),
  accessRestreint: boolean('access_restreint'),
});
export const collectiviteSchema = createSelectSchema(collectiviteTable);
export const createCollectiviteSchema = createInsertSchema(collectiviteTable);
export type CollectiviteType = InferSelectModel<typeof collectiviteTable>;
export type CreateCollectiviteType = InferInsertModel<typeof collectiviteTable>;
