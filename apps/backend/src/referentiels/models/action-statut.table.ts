import { modifiedAt, modifiedBy } from '@/backend/utils/column.utils';
import { statutAvancementEnumValues } from '@/domain/referentiels';
import {
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { actionIdReference } from './action-relation.table';

export const statutAvancementPgEnum = pgEnum(
  'avancement',
  statutAvancementEnumValues
);

export const actionStatutTable = pgTable('action_statut', {
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  actionId: actionIdReference.notNull(),
  avancement: statutAvancementPgEnum('avancement').notNull(),
  avancementDetaille: doublePrecision('avancement_detaille').array(),
  concerne: boolean('concerne').notNull(),
  modifiedBy,
  modifiedAt,
});
