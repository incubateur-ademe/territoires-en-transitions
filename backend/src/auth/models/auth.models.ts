import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { default as jwt } from 'jsonwebtoken';
import { collectiviteTable } from '../../collectivites/models/collectivite.models';

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
  user_id: uuid('user_id').notNull(), // TODO: reference user table
  collectivite_id: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  created_at: timestamp('created_at', { withTimezone: true })
    .default(sql.raw(`CURRENT_TIMESTAMP`))
    .notNull(),
  modified_at: timestamp('modified_at', { withTimezone: true }).default(
    sql.raw(`CURRENT_TIMESTAMP`)
  ),
  active: boolean('active').notNull(),
  niveau_acces: niveauAccessEnum('niveau_acces')
    .notNull()
    .default(NiveauAcces.LECTURE),
  invitation_id: uuid('invitation_id'), // TODO: reference invitation table
});
export type UtilisateurDroitType = InferSelectModel<
  typeof utilisateurDroitTable
>;
export type CreateUtilisateurDroitType = InferInsertModel<
  typeof utilisateurDroitTable
>;

export enum SupabaseRole {
  AUTHENTICATED = 'authenticated',
  SERVICE_ROLE = 'service_role',
  ANON = 'anon', // Anonymous
}

export interface SupabaseJwtPayload extends jwt.JwtPayload {
  email?: string;
  phone?: string;
  app_metadata?: {
    provider: string;
    providers: string[];
  };
  session_id: string;
  role: SupabaseRole;
  is_anonymous: boolean;
}
