import { Injectable, Logger } from '@nestjs/common';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { and, eq, sql } from 'drizzle-orm';
import {
  LoginUserWithOidcProviderResult,
  isEmailVerified,
  OidcClaims,
  OidcProvider,
} from '../oidc.models';
import {
  IdentiteOidc,
  utilisateurIdentiteOidcTable,
} from '../models/utilisateur-identite-oidc.table';
import { LinkOidcIdentityToUserService } from '../link-oidc-identity-to-user/link-oidc-identity-to-user.service';

/**
 * Matching des comptes à la connexion OIDC.
 *
 * - Cas 1 — `sub` connu : maj `last_sign_in_at`/claims, sync email si le
 *   provider en renvoie un différent.
 * - Cas 2 — email connu (aucun `sub`) : liaison automatique (rattachement)
 *   + indicateur `nouvelleLiaison` (toast one-shot). `dcp.deleted`
 *   → traité comme non trouvé (cas 3) ; `dcp.limited` → `compte-desactive`.
 * - Cas 3 — aucun match : `non-reconnu` (la dialog de bienvenue est branchée ensuite).
 */
@Injectable()
export class LoginUserWithOidcProviderService {
  private readonly logger = new Logger(LoginUserWithOidcProviderService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rattacherIdentiteService: LinkOidcIdentityToUserService
  ) {}

  async authentifier(
    provider: OidcProvider,
    claims: OidcClaims,
    tx?: Transaction
  ): Promise<LoginUserWithOidcProviderResult> {
    const db = tx ?? this.databaseService.db;

    const [identiteExistante] = await db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, provider),
          eq(utilisateurIdentiteOidcTable.sub, claims.sub)
        )
      )
      .limit(1);

    if (identiteExistante) {
      return this.authentifierCas1(identiteExistante, claims, db);
    }

    return this.authentifierCas2Ou3(provider, claims, tx);
  }

  /** Cas 1 : `sub` déjà connu — le compte est certain, aucune ambiguïté. */
  private async authentifierCas1(
    identite: IdentiteOidc,
    claims: OidcClaims,
    db: DatabaseService['db'] | Transaction
  ): Promise<LoginUserWithOidcProviderResult> {
    // Sécurité : ne synchroniser `auth.users.email` que si l'email est vérifié
    // (claim explicite, ou provider de confiance quand le claim est absent —
    // cf. isEmailVerified) — sinon un IdP autorisant un email non vérifié
    // pourrait réécrire l'email (confirmé) d'un compte existant.
    if (
      claims.email !== identite.email &&
      isEmailVerified(identite.provider, claims)
    ) {
      await this.rattacherIdentiteService.synchroniserEmail(
        identite.userId,
        claims.email
      );
    }

    await db
      .update(utilisateurIdentiteOidcTable)
      .set({
        claims,
        email: claims.email,
        lastSignInAt: sql`now()`,
      })
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, identite.provider),
          eq(utilisateurIdentiteOidcTable.sub, identite.sub)
        )
      );

    // L'email de session doit correspondre à `auth.users.email` (celui que
    // GoTrue connaît réellement) : la sync peut avoir échoué (garde-fou
    // collision), auquel cas on garde l'ancien email pour le pont session.
    const [authUser] = await db
      .select({ email: authUsersTable.email })
      .from(authUsersTable)
      .where(eq(authUsersTable.id, identite.userId))
      .limit(1);

    this.logger.log(
      `Connexion OIDC ${identite.provider} (sub: ${identite.sub}) : compte reconnu ${identite.userId} (cas 1)`
    );

    return {
      statut: 'connexion',
      userId: identite.userId,
      email: authUser?.email ?? claims.email,
    };
  }

  /** Cas 2 (email connu) ou cas 3 (aucun match). */
  private async authentifierCas2Ou3(
    provider: OidcProvider,
    claims: OidcClaims,
    tx?: Transaction
  ): Promise<LoginUserWithOidcProviderResult> {
    const db = tx ?? this.databaseService.db;

    const [compte] = await db
      .select({
        userId: authUsersTable.id,
        email: authUsersTable.email,
        deleted: dcpTable.deleted,
        limited: dcpTable.limited,
      })
      .from(authUsersTable)
      .innerJoin(dcpTable, eq(dcpTable.id, authUsersTable.id))
      .where(sql`lower(${authUsersTable.email}) = lower(${claims.email})`)
      .limit(1);

    // Aucun compte, ou compte supprimé (dcp.deleted) : traité comme non trouvé.
    if (!compte || compte.deleted) {
      this.logger.log(
        `Connexion OIDC ${provider} (sub: ${claims.sub}) : aucun compte correspondant, compte non reconnu (cas 3)`
      );
      return { statut: 'non-reconnu' };
    }

    // Sécurité (prise de contrôle de compte) : la liaison automatique par
    // email ne doit JAMAIS s'appuyer sur un email que le fournisseur
    // d'identité n'affirme pas avoir vérifié — sinon un agent compromis ou
    // un FI mal configuré pourrait usurper un compte TeT existant. Ici un
    // compte EXISTE pour cet email : on ne crée donc pas de doublon (cas 3),
    // on renvoie un statut dédié pour dire à l'utilisateur de vérifier son
    // email d'abord (alerte côté app). ProConnect n'émet pas `email_verified`
    // mais son email est de confiance (cf. isEmailVerified).
    if (!isEmailVerified(provider, claims)) {
      // Pas d'email en clair dans les logs (CWE-532/RGPD) : sub + userId suffisent.
      this.logger.warn(
        `Connexion OIDC ${provider} (sub: ${claims.sub}) : l'email correspond au compte ${compte.userId} mais n'est pas marqué vérifié par le provider — rattachement automatique refusé`
      );
      return { statut: 'email-non-verifie' };
    }

    if (compte.limited) {
      this.logger.warn(
        `Connexion OIDC ${provider} (sub: ${claims.sub}) : compte ${compte.userId} désactivé (dcp.limited), liaison refusée`
      );
      return { statut: 'compte-desactive' };
    }

    await this.rattacherIdentiteService.rattacherIdentite(
      provider,
      compte.userId,
      claims,
      tx
    );

    return {
      statut: 'connexion',
      userId: compte.userId,
      email: compte.email ?? claims.email,
      nouvelleLiaison: true,
    };
  }
}
