import { InferInsertModel } from 'drizzle-orm';
import {
  AnyPgColumn,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/models/collectivite.models';
import { planActionTypeTable } from './plan-action-type.table';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const axeTable = pgTable('axe', {
  id: serial('id').primaryKey(),
  nom: text('nom'),
  collectivite_id: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  parent: integer('parent').references((): AnyPgColumn => axeTable.id),
  plan: integer('plan').references((): AnyPgColumn => axeTable.id),
  type: integer('type').references(() => planActionTypeTable.id),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  modified_at: timestamp('modified_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  modified_by: uuid('modified_by'), // TODO references auth.uid
  panier_id: integer('panier_id'), // TODO references panier
});
export type CreateAxeType = InferInsertModel<typeof axeTable>;

export const axeSchema = createSelectSchema(axeTable);
