import { InferInsertModel } from 'drizzle-orm';
import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { collectiviteTable } from '../../collectivites/models/collectivite.table';
import {
  createdAt,
  modifiedAt,
  modifiedBy,
} from '../../common/models/column.helpers';
import { panierTable } from '../../paniers/models/panier.table';
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
  createdAt,
  modifiedAt,
  modifiedBy,
  panierId: integer('panier_id').references(() => panierTable.id),
});
export type CreateAxeType = InferInsertModel<typeof axeTable>;

export const axeSchema = createSelectSchema(axeTable);
