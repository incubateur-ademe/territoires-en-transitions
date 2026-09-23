import {
  createdAt,
  modifiedAt,
  modifiedBy,
} from '@tet/backend/utils/column.utils';
import {
  AnyPgColumn,
  date,
  integer,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../../../collectivites/shared/models/collectivite.table';
import { planActionTypeTable } from './plan-action-type.table';

export const axeTable = pgTable('axe', {
  id: serial('id').primaryKey(),
  nom: text('nom'),
  description: text('description'),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  parent: integer('parent').references((): AnyPgColumn => axeTable.id),
  plan: integer('plan').references((): AnyPgColumn => axeTable.id),
  typeId: integer('type').references(() => planActionTypeTable.id),
  dateDebut: date('date_debut', { mode: 'string' }),
  dateFin: date('date_fin', { mode: 'string' }),
  createdAt,
  modifiedAt,
  modifiedBy,
});
