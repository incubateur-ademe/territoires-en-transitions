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
import { collectiviteTable } from '../../collectivites/models/collectivite.table';
import { panierTable } from '../../panier/models/panier.table';
import { planActionTypeTable } from './plan-action-type.table';

export const axeTable: ReturnType<typeof pgTable> = pgTable('axe', {
  id: serial('id').primaryKey(),
  nom: text('nom'),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  parent: integer('parent').references(() => axeTable.id),
  plan: integer('plan').references(() => axeTable.id),
  type: integer('type').references(() => planActionTypeTable.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  modifiedAt: timestamp('modified_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  modifiedBy: uuid('modified_by'), // TODO references auth.uid
  panierId: integer('panier_id').references(() => panierTable.id),
});
export type CreateAxeType = InferInsertModel<typeof axeTable>;
