import { modifiedAt, modifiedBy } from '@tet/backend/utils/column.utils';
import { statutAvancementEnumSchemaCreateInDatabaseValues } from '@tet/domain/referentiels';
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
  statutAvancementEnumSchemaCreateInDatabaseValues
);

export const actionStatutTable = pgTable('action_statut', {
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  actionId: actionIdReference.notNull(),
  avancement: statutAvancementPgEnum('avancement').notNull(),
  avancementDetaille: doublePrecision('avancement_detaille')
    .array()
    .$type<[number, number, number]>(),
  concerne: boolean('concerne').notNull(),
  modifiedBy,
  modifiedAt,
});
