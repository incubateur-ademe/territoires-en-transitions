import { Injectable, Logger } from '@nestjs/common';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { render } from '@react-email/components';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { utilisateurIdentiteOidcInvitationTable } from '../models/utilisateur-identite-oidc-invitation.table';
import { OidcSessionTicketService } from '../oidc-session-ticket/oidc-session-ticket.service';
import { genererTokenRattachement } from '../oidc-invitation-token.utils';
import InviteUserToLinkOidcIdentityEmail from './invite-user-to-link-oidc-identity.email';
import { InviteUserToLinkOidcIdentityError } from './invite-user-to-link-oidc-identity.errors';

/**
 * Seule erreur distincte du succès générique anti-énumération : le ticket
 * (preuve de l'identité ProConnect) a expiré ou est invalide pendant que
 * l'utilisateur remplissait le formulaire de fallback. Ce n'est PAS une
 * énumération de compte — c'est la preuve qu'on a (ou pas) un ticket valide
 * en cours, information déjà connue de l'utilisateur qui vient de suivre le
 * lien de retour ProConnect.
 */

export type InviteUserToLinkOidcIdentityResult = {
  statut: 'email-envoye-si-compte-existant';
};

const EXPIRATION_DEMANDE = { hours: 24 } as const;

/**
 * Fallback « mot de passe oublié » du parcours de bienvenue ProConnect
 * (cas 3-Oui, branche secondaire) : l'utilisateur affirme avoir un
 * compte mais échoue la re-connexion classique. Il saisit l'adresse de son
 * ANCIEN compte ; un email de confirmation à usage unique y est envoyé
 * (jamais à l'email ProConnect).
 *
 * Anti-énumération de comptes : la réponse est TOUJOURS le même succès
 * générique, qu'un compte existe ou non à `initialMail` — seule une erreur
 * de ticket (preuve d'identité ProConnect déjà en cours, pas une énumération
 * de compte) sort de ce cas générique.
 */
@Injectable()
export class InviteUserToLinkOidcIdentityService {
  private readonly logger = new Logger(
    InviteUserToLinkOidcIdentityService.name
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly transactionManager: TransactionManager,
    private readonly configurationService: ConfigurationService,
    private readonly ticketOidcService: OidcSessionTicketService,
    private readonly emailService: EmailService
  ) {}

  async inviteUserToLinkIdentity(
    ticket: string,
    initialMail: string
  ): Promise<
    Result<InviteUserToLinkOidcIdentityResult, InviteUserToLinkOidcIdentityError>
  > {
    const ticketResult = this.ticketOidcService.verifier(ticket);
    if (!ticketResult.success) {
      // Cf. demander-rattachement.errors.ts : seule erreur remontée telle
      // quelle, ce n'est pas une énumération de compte.
      return failure(ticketResult.error);
    }
    const { provider, claims } = ticketResult.data;

    const db = this.databaseService.db;

    const [compte] = await db
      .select({
        userId: authUsersTable.id,
        deleted: dcpTable.deleted,
      })
      .from(authUsersTable)
      .innerJoin(dcpTable, eq(dcpTable.id, authUsersTable.id))
      .where(sql`lower(${authUsersTable.email}) = lower(${initialMail})`)
      .limit(1);

    const succesGenerique: InviteUserToLinkOidcIdentityResult = {
      statut: 'email-envoye-si-compte-existant',
    };

    // Aucun compte à cette adresse, ou compte supprimé (dcp.deleted) : on ne
    // fait RIEN — ni demande créée, ni email envoyé — mais on renvoie quand
    // même le succès générique (anti-énumération).
    if (!compte || compte.deleted) {
      this.logger.log(
        `Demande de rattachement ${provider} (sub: ${claims.sub}) : aucun compte trouvé pour l'ancien email fourni — succès générique renvoyé, rien créé`
      );
      return success(succesGenerique);
    }

    const { token, tokenHash } = genererTokenRattachement();
    const expiresAt = DateTime.now().plus(EXPIRATION_DEMANDE).toUTC().toSQL();
    if (!expiresAt) {
      // Ne devrait jamais arriver (DateTime.now() est toujours valide), mais
      // évite un `expiresAt: null` silencieux dans l'insert ci-dessous.
      throw new Error('Impossible de calculer expiresAt');
    }

    const transactionResult = await this.transactionManager.executeSingle<
      void,
      string
    >(async (tx) => {
      // Une seule demande pendante par (provider, sub) : l'index unique
      // partiel `WHERE confirmed_at IS NULL` interdit d'insérer la nouvelle
      // tant que l'ancienne demande pendante existe encore — on la supprime
      // explicitement (DELETE, pas UPDATE confirmed_at) : `confirmed_at`
      // signifie « l'utilisateur a cliqué le lien », marquer une demande
      // remplacée comme confirmée serait un mensonge dans l'audit.
      await tx
        .delete(utilisateurIdentiteOidcInvitationTable)
        .where(
          and(
            eq(utilisateurIdentiteOidcInvitationTable.provider, provider),
            eq(utilisateurIdentiteOidcInvitationTable.sub, claims.sub),
            isNull(utilisateurIdentiteOidcInvitationTable.confirmedAt)
          )
        );

      await tx.insert(utilisateurIdentiteOidcInvitationTable).values({
        tokenHash,
        provider,
        sub: claims.sub,
        claims,
        emailProvider: claims.email,
        initialMail,
        userId: compte.userId,
        expiresAt,
      });

      return success(undefined);
    });

    if (!transactionResult.success) {
      this.logger.error(
        `Echec de création de la demande de rattachement (compte ${compte.userId}): ${transactionResult.error}`
      );
      return failure('DATABASE_ERROR');
    }

    const appUrl = this.configurationService.get('APP_URL');
    const confirmationUrl = new URL(
      '/auth/proconnect/confirmer-rattachement',
      appUrl
    );
    confirmationUrl.searchParams.set('token', token);

    const demandeurNom = [claims.given_name, claims.usual_name]
      .filter(Boolean)
      .join(' ');

    const html = await render(
      InviteUserToLinkOidcIdentityEmail({
        sendToEmail: initialMail,
        demandeurNom,
        demandeurEmail: claims.email,
        confirmationUrl: confirmationUrl.href,
      })
    );

    const sendResult = await this.emailService.sendEmail({
      to: initialMail,
      subject: 'Confirmez le rattachement de votre compte ProConnect',
      html,
    });

    if (!sendResult.success) {
      // Ne remonte jamais l'échec d'envoi au client (anti-énumération +
      // l'email peut être transitoirement indisponible) : loggé pour le
      // support, la demande reste en base et un renvoi la remplacera.
      this.logger.warn(
        `Echec d'envoi de l'email de rattachement (compte ${compte.userId}) : ${sendResult.error.errorMessage}`
      );
    }

    this.logger.log(
      `Demande de rattachement ${provider} (sub: ${claims.sub}) créée pour le compte ${compte.userId}, email envoyé à l'ancienne adresse`
    );

    return success(succesGenerique);
  }
}
