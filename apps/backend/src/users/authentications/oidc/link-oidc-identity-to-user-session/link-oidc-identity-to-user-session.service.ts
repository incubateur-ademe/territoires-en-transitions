import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { LinkOidcIdentityToUserService } from '../link-oidc-identity-to-user/link-oidc-identity-to-user.service';
import { OidcSessionTicketService } from '../oidc-session-ticket/oidc-session-ticket.service';
import { LinkOidcIdentityToUserSessionError } from './link-oidc-identity-to-user-session.errors';

export type LinkOidcIdentityToUserSessionResult = {
  email: string;
};

/**
 * Liaison « cas Oui, re-connexion classique » : au retour
 * ProConnect sans correspondance automatique (cas 3), l'utilisateur qui
 * affirme avoir déjà un compte est renvoyé vers la connexion classique
 * (`apps/auth`). Une fois cette session classique établie, cet endpoint
 * rattache le `sub` du ticket ProConnect au compte de CETTE session — double
 * preuve : le ticket prouve l'identité externe, la session prouve la
 * possession de l'ancien compte. `authedProcedure` porte la seconde preuve,
 * il n'y a donc rien d'autre à vérifier côté session.
 */
@Injectable()
export class LinkOidcIdentityToUserSessionService {
  private readonly logger = new Logger(
    LinkOidcIdentityToUserSessionService.name
  );

  constructor(
    private readonly ticketOidcService: OidcSessionTicketService,
    private readonly rattacherIdentiteService: LinkOidcIdentityToUserService
  ) {}

  async linkIdentityToUserSession(
    user: AuthenticatedUser,
    ticket: string
  ): Promise<
    Result<LinkOidcIdentityToUserSessionResult, LinkOidcIdentityToUserSessionError>
  > {
    const ticketResult = this.ticketOidcService.verifier(ticket);
    if (!ticketResult.success) {
      // Les codes du ticket (`TICKET_INVALIDE`/`TICKET_EXPIRE`) sont déjà les
      // noms de domaine attendus ici : pas de remapping nécessaire.
      return failure(ticketResult.error);
    }
    const { provider, claims } = ticketResult.data;

    const result = await this.rattacherIdentiteService.rattacherAvecGardeFous(
      provider,
      user.id,
      claims
    );
    if (!result.success) {
      return failure(result.error);
    }

    this.logger.log(
      `Identité OIDC ${provider} rattachée au compte ${user.id} via re-connexion classique (cas 3 → Oui)`
    );

    return success(result.data);
  }
}
