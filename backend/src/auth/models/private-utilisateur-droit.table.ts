import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, uuid } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/models/collectivite.table';
import { createdAt, modifiedAt } from '../../common/models/column.helpers';
import { invitationTable } from './invitation.table';
import { niveauAccessEnum, NiveauAcces } from './niveau-acces.enum';

export const utilisateurDroitTable = pgTable('private_utilisateur_droit', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(), // TODO: reference user table
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  createdAt,
  modifiedAt,
  active: boolean('active').notNull(),
  niveauAcces: niveauAccessEnum('niveau_acces')
    .notNull()
    .default(NiveauAcces.LECTURE),
  invitationId: uuid('invitation_id').references(() => invitationTable.id),
});

export type UtilisateurDroitType = InferSelectModel<
  typeof utilisateurDroitTable
>;
export type CreateUtilisateurDroitType = InferInsertModel<
  typeof utilisateurDroitTable
>;
