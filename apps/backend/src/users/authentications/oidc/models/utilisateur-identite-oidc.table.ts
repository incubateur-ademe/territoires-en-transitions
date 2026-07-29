import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import {
  createdAt,
  SQL_CURRENT_TIMESTAMP,
  TIMESTAMP_OPTIONS,
} from '@tet/backend/utils/column.utils';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const oidcProviders = ['proconnect', 'moncompteademe'] as const;

export const oidcProviderSchema = z.enum(oidcProviders);

export type OidcProvider = z.infer<typeof oidcProviderSchema>;

/**
 * Identités OIDC externes (ProConnect puis MonCompteAdeme) liées aux comptes.
 *
 * - `sub` = subject OIDC : identifiant technique chez le provider, stabilité
 *   relative (le sub ProConnect change si l'agent change de FI). La rotation
 *   se fait par upsert sur (user_id, provider).
 * - `auth.users.id` reste la clé interne, jamais le sub.
 * - RLS activée sans policy : accès service_role uniquement.
 */
export const utilisateurIdentiteOidcTable = pgTable(
  'utilisateur_identite_oidc',
  {
    provider: text('provider').notNull().$type<OidcProvider>(),
    sub: text('sub').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsersTable.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    siret: text('siret'),
    idpId: text('idp_id'),
    claims: jsonb('claims').$type<Record<string, unknown>>(),
    createdAt,
    lastSignInAt: timestamp('last_sign_in_at', TIMESTAMP_OPTIONS)
      .default(SQL_CURRENT_TIMESTAMP)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.sub] }),
    unique('utilisateur_identite_oidc_user_id_provider_key').on(
      table.userId,
      table.provider
    ),
  ]
);

export type IdentiteOidc = InferSelectModel<
  typeof utilisateurIdentiteOidcTable
>;
export type IdentiteOidcInsert = InferInsertModel<
  typeof utilisateurIdentiteOidcTable
>;
