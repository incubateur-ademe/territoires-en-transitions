import { collectiviteTable } from '@/backend/collectivites';
import { createdAt, modifiedAt } from '@/backend/utils';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  uuid,
} from 'drizzle-orm/pg-core';

export enum NiveauAcces {
  LECTURE = 'lecture',
  EDITION = 'edition',
  ADMIN = 'admin',
}

export const niveauAccessOrdonne = [
  NiveauAcces.LECTURE,
  NiveauAcces.EDITION,
  NiveauAcces.ADMIN,
] as const;
export const niveauAccessEnum = pgEnum('niveau_acces', niveauAccessOrdonne);

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
  invitationId: uuid('invitation_id'), // TODO: reference invitation table
});
export type UtilisateurDroitType = InferSelectModel<
  typeof utilisateurDroitTable
>;
export type CreateUtilisateurDroitType = InferInsertModel<
  typeof utilisateurDroitTable
>;
