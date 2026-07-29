import { Injectable, Logger } from '@nestjs/common';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { and, eq, sql } from 'drizzle-orm';
import { OidcClaims, OidcProvider } from '../oidc.models';
import { utilisateurIdentiteOidcTable } from '../models/utilisateur-identite-oidc.table';

export const rattacherAvecGardeFousErrors = [
  'IDENTITE_DEJA_LIEE_AILLEURS',
  'COMPTE_SUPPRIME',
] as const;
export type LinkOidcIdentityToUserError =
  (typeof rattacherAvecGardeFousErrors)[number];

/**
 * Rattachement d'une identité OIDC à un compte (cas 2 du matching) et
 * synchronisation de l'email d'`auth.users`.
 */
@Injectable()
export class LinkOidcIdentityToUserService {
  private readonly logger = new Logger(LinkOidcIdentityToUserService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly supabaseService: SupabaseService
  ) {}

  /**
   * Lie le `sub` prouvé par le provider au compte trouvé par email (cas 2).
   * Upsert sur `(user_id, provider)` : si ce compte avait déjà
   * une identité pour ce provider (rotation du `sub` chez le FI), la
   * dernière identité prouvée remplace l'ancienne — loggé.
   */
  async rattacherIdentite(
    provider: OidcProvider,
    userId: string,
    claims: OidcClaims,
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;

    await db
      .insert(utilisateurIdentiteOidcTable)
      .values({
        provider,
        sub: claims.sub,
        userId,
        email: claims.email,
        siret: claims.siret,
        idpId: claims.idp_id,
        claims,
        lastSignInAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: [
          utilisateurIdentiteOidcTable.userId,
          utilisateurIdentiteOidcTable.provider,
        ],
        set: buildConflictUpdateColumns(utilisateurIdentiteOidcTable, [
          'sub',
          'email',
          'siret',
          'idpId',
          'claims',
          'lastSignInAt',
        ]),
      });

    this.logger.log(
      `Identité OIDC ${provider} rattachée au compte ${userId} (cas 2, liaison automatique par email)`
    );
  }

  /**
   * Rattache un `sub` au compte `userId`, avec les garde-fous de sécurité
   * partagés par tous les parcours de liaison (reconnexion classique,
   * liaison volontaire depuis le profil) : anti-vol de compte (un sub déjà
   * prouvé pour un AUTRE compte n'est jamais réassigné sans consentement) et
   * défense en profondeur contre un compte `dcp.deleted`.
   */
  async rattacherAvecGardeFous(
    provider: OidcProvider,
    userId: string,
    claims: OidcClaims,
    tx?: Transaction
  ): Promise<Result<{ email: string }, LinkOidcIdentityToUserError>> {
    const db = tx ?? this.databaseService.db;

    const [identiteExistante] = await db
      .select({ userId: utilisateurIdentiteOidcTable.userId })
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, provider),
          eq(utilisateurIdentiteOidcTable.sub, claims.sub)
        )
      )
      .limit(1);

    if (identiteExistante && identiteExistante.userId !== userId) {
      this.logger.warn(
        `Rattachement OIDC ${provider} refusé : le sub est déjà lié au compte ${identiteExistante.userId}, différent du compte ${userId}`
      );
      return failure('IDENTITE_DEJA_LIEE_AILLEURS');
    }

    const [dcp] = await db
      .select({ deleted: dcpTable.deleted })
      .from(dcpTable)
      .where(eq(dcpTable.id, userId))
      .limit(1);

    if (!dcp || dcp.deleted) {
      this.logger.warn(
        `Rattachement OIDC ${provider} refusé : compte ${userId} supprimé (dcp.deleted)`
      );
      return failure('COMPTE_SUPPRIME');
    }

    await this.rattacherIdentite(provider, userId, claims, tx);

    return success({ email: claims.email });
  }

  /**
   * Synchronise `auth.users.email` avec l'email vérifié fourni par le
   * provider OIDC, quand il diverge de celui déjà connu.
   *
   * Garde-fou : si l'email est déjà pris par un autre compte, Supabase
   * répond en erreur — ce n'est jamais bloquant pour la connexion : on
   * logge un warning et on continue. `identite_oidc.email` peut alors
   * diverger de `auth.users.email` ; c'est documenté et acceptable (cf.
   * commentaire de `identite-oidc.table.ts`).
   *
   * @returns `true` si la synchronisation a réussi, `false` sinon (garde-fou).
   */
  async synchroniserEmail(userId: string, email: string): Promise<boolean> {
    const { error } =
      await this.supabaseService.client.auth.admin.updateUserById(userId, {
        email,
        email_confirm: true,
      });

    if (error) {
      this.logger.warn(
        `Synchronisation de l'email OIDC impossible pour le compte ${userId} (probable collision d'email avec un autre compte) : ${error.message}`
      );
      return false;
    }

    return true;
  }
}
