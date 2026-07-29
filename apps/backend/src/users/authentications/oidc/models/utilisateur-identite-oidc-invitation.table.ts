import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { createdAt, TIMESTAMP_OPTIONS } from '@tet/backend/utils/column.utils';
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { OidcProvider } from './utilisateur-identite-oidc.table';

/**
 * Demandes de rattachement d'une identité OIDC externe à un compte
 * historique via email de confirmation (fallback « mot de passe oublié »
 * du parcours déclaratif).
 *
 * - `token_hash` = sha256 du token envoyé par email : le token brut n'est
 *   jamais stocké (usage unique, anti-énumération).
 * - Une seule demande pendante par (provider, sub) : le renvoi remplace.
 * - `expires_at` = 24 h après création, contrôlé applicativement.
 * - RLS activée sans policy : accès service_role uniquement.
 */
export const utilisateurIdentiteOidcInvitationTable = pgTable(
  'utilisateur_identite_oidc_invitation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenHash: text('token_hash').notNull().unique(),
    provider: text('provider').notNull().$type<OidcProvider>(),
    sub: text('sub').notNull(),
    claims: jsonb('claims').$type<Record<string, unknown>>().notNull(),
    emailProvider: text('email_provider').notNull(),
    initialMail: text('initial_mail').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsersTable.id, { onDelete: 'cascade' }),
    createdAt,
    expiresAt: timestamp('expires_at', TIMESTAMP_OPTIONS).notNull(),
    confirmedAt: timestamp('confirmed_at', TIMESTAMP_OPTIONS),
  },
  (table) => [
    uniqueIndex('utilisateur_identite_oidc_invitation_pending_unique')
      .on(table.provider, table.sub)
      .where(sql`confirmed_at IS NULL`),
  ]
);

export type DemandeRattachement = InferSelectModel<
  typeof utilisateurIdentiteOidcInvitationTable
>;
export type DemandeRattachementInsert = InferInsertModel<
  typeof utilisateurIdentiteOidcInvitationTable
>;
