import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgSchema,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/models/collectivite.table';
import { createdAt, createdBy } from '../../common/models/column.helpers';
import { niveauAccessEnum } from './niveau-acces.enum';

export const utilisateurSchema = pgSchema('utilisateur');

export const invitationTable = utilisateurSchema.table('invitation', {
  id: uuid('id')
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  niveau: niveauAccessEnum('niveau').notNull(),
  email: text('email').notNull(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  createdBy: createdBy.notNull(),
  createdAt,
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  consumed: boolean('consumed'),
  pending: boolean('pending'),
  active: boolean('active').default(true),
});
