import { createdAt, modifiedAt } from '@/backend/utils/column.utils';
import { boolean, integer, pgTable, serial, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { collectiviteTable } from '../../../collectivites/shared/models/collectivite.table';
import { invitationTable } from '../../models/invitation.table';
import {
  CollectiviteAccessLevelEnum,
  collectiviteAccessLevelPgEnum,
} from './collectivite-access-level.enum';

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

export const utilisateurCollectiviteAccessSchema = createSelectSchema(
  utilisateurCollectiviteAccessTable
);

export const utilisateurCollectiviteAccessAvecNomSchema =
  utilisateurCollectiviteAccessSchema.extend({
    collectiviteNom: z.string(),
    collectiviteAccesRestreint: z.boolean().nullable(),
  });

export type UtilisateurCollectiviteAccess = z.infer<
  typeof utilisateurCollectiviteAccessAvecNomSchema
>;
