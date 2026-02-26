import { createdAt, modifiedAt } from '@tet/backend/utils/column.utils';
import { CollectiviteRole } from '@tet/domain/users';
import {
  boolean,
  integer,
  pgTable,
  serial,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { invitationTable } from '../../collectivites/membres/invitation.table';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { collectiviteRolePgEnum } from './roles/collectivite-role.column';

export const utilisateurCollectiviteAccessTable = pgTable(
  'private_utilisateur_droit',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').notNull(), // TODO: reference user table
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id),
    createdAt,
    modifiedAt,
    isActive: boolean('active').notNull(),
    role: collectiviteRolePgEnum('niveau_acces')
      .notNull()
      .default(CollectiviteRole.LECTURE),
    invitationId: uuid('invitation_id').references(() => invitationTable.id),
  },
  (t) => [
    uniqueIndex('unique_user_collectivite').on(t.userId, t.collectiviteId),
  ]
);
