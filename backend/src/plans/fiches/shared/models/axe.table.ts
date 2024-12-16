import { createdAt, modifiedAt, modifiedBy } from '@/backend/utils';
import { InferInsertModel } from 'drizzle-orm';
import {
  AnyPgColumn,
  integer,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { collectiviteTable } from '../../../../collectivites/models/collectivite.table';
import { panierTable } from '../../../../panier/models/panier.table';
import {
  planActionTypeSchema,
  planActionTypeTable,
} from './plan-action-type.table';

export const axeTable = pgTable('axe', {
  id: serial('id').primaryKey(),
  nom: text('nom'),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  parent: integer('parent').references((): AnyPgColumn => axeTable.id),
  plan: integer('plan').references((): AnyPgColumn => axeTable.id),
  typeId: integer('type').references(() => planActionTypeTable.id),
  createdAt,
  modifiedAt,
  modifiedBy,
  panierId: integer('panier_id').references(() => panierTable.id),
});

export type CreateAxeType = InferInsertModel<typeof axeTable>;

export const axeTableSchema = createSelectSchema(axeTable);

export const axeSchema = axeTableSchema.extend({
  axes: axeTableSchema.array().nullish(),
  type: planActionTypeSchema.nullable(),
});

export type Axe = z.input<typeof axeSchema>;
