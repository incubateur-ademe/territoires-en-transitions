import { createdAt, modifiedAt } from '@/domain/utils';
import { boolean, integer, pgTable, serial, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { collectiviteTable } from '../../../collectivites/shared/models/collectivite.table';
import { invitationTable } from '../../models/invitation.table';
import { PermissionLevel, niveauAccessEnum } from './niveau-acces.enum';

export const utilisateurPermissionTable = pgTable('private_utilisateur_droit', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(), // TODO: reference user table
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  createdAt,
  modifiedAt,
  isActive: boolean('active').notNull(),
  niveau: niveauAccessEnum('niveau_acces')
    .notNull()
    .default(PermissionLevel.LECTURE),
  invitationId: uuid('invitation_id').references(() => invitationTable.id),
});

export const utilisateurPermissionSchema = createSelectSchema(
  utilisateurPermissionTable
);

export type UtilisateurPermission =
  typeof utilisateurPermissionTable.$inferSelect;
