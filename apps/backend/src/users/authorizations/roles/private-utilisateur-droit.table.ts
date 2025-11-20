import { createdAt, modifiedAt } from '@tet/backend/utils/column.utils';
import { CollectiviteAccessLevelEnum } from '@tet/domain/users';
import { boolean, integer, pgTable, serial, uuid } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../../collectivites/shared/models/collectivite.table';
import { invitationTable } from '../../models/invitation.table';
import { collectiviteAccessLevelPgEnum } from './permission-level.column';

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
    accessLevel: collectiviteAccessLevelPgEnum('niveau_acces')
      .notNull()
      .default(CollectiviteAccessLevelEnum.LECTURE),
    invitationId: uuid('invitation_id').references(() => invitationTable.id),
  }
);
