import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgSchema,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import {
  createdAt,
  createdBy,
  TIMESTAMP_OPTIONS,
} from '../../utils/column.utils';
import { collectiviteAccessLevelPgEnum } from '../authorizations/roles/permission-level.column';

export const utilisateurSchema = pgSchema('utilisateur');

export const invitationTable = utilisateurSchema.table('invitation', {
  id: uuid('id')
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  accessLevel: collectiviteAccessLevelPgEnum('niveau').notNull(),
  email: text('email').notNull(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  createdBy: createdBy.notNull(),
  createdAt,
  acceptedAt: timestamp('accepted_at', TIMESTAMP_OPTIONS),
  consumed: boolean('consumed'),
  pending: boolean('pending'),
  active: boolean('active').default(true),
});
