import { createdAt, modifiedAt } from '@/backend/utils/column.utils';
import { boolean, integer, pgTable, serial, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { collectiviteTable } from '../../../collectivites/shared/models/collectivite.table';
import { invitationTable } from '../../models/invitation.table';
import {
  PermissionLevelEnum,
  permissionLevelPgEnum,
} from './permission-level.enum';

export const utilisateurPermissionTable = pgTable('private_utilisateur_droit', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(), // TODO: reference user table
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  createdAt,
  modifiedAt,
  isActive: boolean('active').notNull(),
  permissionLevel: permissionLevelPgEnum('niveau_acces')
    .notNull()
    .default(PermissionLevelEnum.LECTURE),
  invitationId: uuid('invitation_id').references(() => invitationTable.id),
});

export const utilisateurPermissionSchema = createSelectSchema(
  utilisateurPermissionTable
);

export const utilisateurPermissionAvecNomSchema =
  utilisateurPermissionSchema.extend({
    collectiviteNom: z.string().optional(),
    collectiviteAccesRestreint: z.boolean().optional(),
  });

export type UtilisateurPermission = z.infer<
  typeof utilisateurPermissionAvecNomSchema
>;
