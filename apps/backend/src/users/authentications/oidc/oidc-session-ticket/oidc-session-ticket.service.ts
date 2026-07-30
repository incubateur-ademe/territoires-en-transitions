import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { OidcClaims, OidcProvider, oidcClaimsSchema } from '../oidc.models';

const TICKET_TTL_SECONDS = 15 * 60;

export type TicketOidcPayload = {
  provider: OidcProvider;
  claims: OidcClaims;
};

export const ticketOidcErrors = ['TICKET_INVALIDE', 'TICKET_EXPIRE'] as const;
export type TicketOidcError = (typeof ticketOidcErrors)[number];

/**
 * Ticket JWT signé : porte les claims OIDC vérifiés d'une
 * connexion sans correspondance (cas 3) entre le callback et la réponse de
 * l'utilisateur à la dialog de bienvenue. TTL 15 min. Aucune donnée n'est
 * créée tant que le ticket n'a pas été consommé.
 */
@Injectable()
export class OidcSessionTicketService {
  private readonly logger = new Logger(OidcSessionTicketService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configurationService: ConfigurationService
  ) {}

  signer(payload: TicketOidcPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.secret(),
      expiresIn: TICKET_TTL_SECONDS,
    });
  }

  verifier(ticket: string): Result<TicketOidcPayload, TicketOidcError> {
    try {
      const decoded = this.jwtService.verify<
        TicketOidcPayload & { iat: number; exp: number }
      >(ticket, { secret: this.secret() });

      const claims = oidcClaimsSchema.safeParse(decoded.claims);
      if (!claims.success || !decoded.provider) {
        this.logger.warn('Ticket OIDC décodé mais claims invalides');
        return failure('TICKET_INVALIDE');
      }

      return success({ provider: decoded.provider, claims: claims.data });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const expire = message.toLowerCase().includes('expired');
      this.logger.warn(
        `Ticket OIDC rejeté (${expire ? 'expiré' : 'invalide'})`
      );
      return failure(expire ? 'TICKET_EXPIRE' : 'TICKET_INVALIDE');
    }
  }

  private secret(): string {
    const secret = this.configurationService.get('OIDC_TICKET_SECRET');
    if (!secret) {
      throw new Error('OIDC_TICKET_SECRET manquant');
    }
    return secret;
  }
}
