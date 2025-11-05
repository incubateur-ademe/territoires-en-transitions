import {
  createdAt,
  modifiedAt,
  modifiedBy,
} from '@/backend/utils/column.utils';
import {
  AnyPgColumn,
  integer,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../../../collectivites/shared/models/collectivite.table';
import { panierTable } from '../../../paniers/models/panier.table';
import { planActionTypeTable } from './plan-action-type.table';

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
