import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import {
  createdAt,
  modifiedAt,
  modifiedBy,
  TIMESTAMP_OPTIONS,
} from '@tet/backend/utils/column.utils';
import {
  PlanReferenceProgramme,
  planSourceValues,
  planStatusValues,
} from '@tet/domain/plans';
import {
  AnyPgColumn,
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../../../collectivites/shared/models/collectivite.table';
import { planActionTypeTable } from './plan-action-type.table';

export const axeTable = pgTable('axe', {
  id: serial('id').primaryKey(),
  nom: text('nom'),
  description: text('description'),
  referenceProgramme: text(
    'reference_programme'
  ).$type<PlanReferenceProgramme>(),
  referenceCode: text('reference_code'),
  engagementsCodes: text('engagements_codes').array(),
  indicateurSourceMetadonneeId: integer('indicateur_source_metadonnee_id')
    .unique()
    .references(() => indicateurSourceMetadonneeTable.id, {
      onDelete: 'restrict',
    }),
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
  source: text('source', { enum: planSourceValues }),
  verifiedAt: timestamp('verified_at', TIMESTAMP_OPTIONS),
  verifiedBy: uuid('verified_by').references(() => authUsersTable.id, {
    onDelete: 'set null',
  }),
  status: text('status', { enum: planStatusValues })
    .notNull()
    .default('active'),
});
