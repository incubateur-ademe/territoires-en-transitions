import { Controller, Get, Logger, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AllowPublicAccess } from '@tet/backend/users/decorators/allow-public-access.decorator';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import type { Response } from 'express';
import { OidcErrorCode } from '../oidc.models';
import { sanitizeNextPath } from '../oidc.utils';
import { OidcSessionTicketService } from '../oidc-session-ticket/oidc-session-ticket.service';
import { CreateUserOidcIdentityService } from './create-user-oidc-identity.service';

/**
 * Endpoint REST public du cas 3-Non : atteint par redirection navigateur
 * depuis la dialog de bienvenue quand l'utilisateur répond « Non, je n'ai pas
 * de compte ». GET + redirect, même mécanisme que
 * `OidcController.callback` — jamais de 500 nue, toute erreur
 * redirige vers `${APP_URL}/login?erreur=<code>`.
 */
@ApiExcludeController()
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('auth/proconnect')
export class CreateUserOidcIdentityController {
  private readonly logger = new Logger(CreateUserOidcIdentityController.name);

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly ticketOidcService: OidcSessionTicketService,
    private readonly creerCompteOidcService: CreateUserOidcIdentityService
  ) {}

  @AllowPublicAccess()
  @Get('creer-compte')
  async creerCompte(
    @Query('ticket') ticket: string | undefined,
    @Query('next') next: string | undefined,
    @Res() res: Response
  ): Promise<void> {
    const nextPath = sanitizeNextPath(next);

    try {
      if (!ticket) {
        this.redirectLoginError(res, 'oidc-ticket-expire');
        return;
      }

      const verification = this.ticketOidcService.verifier(ticket);
      if (!verification.success) {
        this.redirectLoginError(res, 'oidc-ticket-expire');
        return;
      }

      const { provider, claims } = verification.data;

      const creation = await this.creerCompteOidcService.creerCompte(
        provider,
        claims
      );
      if (!creation.success) {
        if (creation.error === 'EMAIL_NON_VERIFIE') {
          // Un compte existe pour cet email non vérifié : même alerte que le
          // callback (écran de bienvenue en mode alerte), pas un dead-end login.
          const bienvenueUrl = new URL(
            '/auth/proconnect',
            this.configurationService.get('APP_URL')
          );
          bienvenueUrl.searchParams.set('erreur', 'oidc-email-non-verifie');
          res.redirect(303, bienvenueUrl.href);
          return;
        }
        this.redirectLoginError(
          res,
          creation.error === 'CREATION_COMPTE_ERROR'
            ? 'oidc-echec-creation-compte'
            : 'oidc-echec-session'
        );
        return;
      }

      const verifyUrl = new URL(
        '/auth/verify',
        this.configurationService.get('APP_URL')
      );
      verifyUrl.searchParams.set('token_hash', creation.data.hashedToken);
      if (nextPath) {
        verifyUrl.searchParams.set('next', nextPath);
      }

      res.redirect(303, verifyUrl.href);
    } catch (error) {
      this.logger.error(
        `Erreur inattendue lors de la création de compte OIDC (cas 3-Non, U5): ${
          error instanceof Error ? error.stack ?? error.message : String(error)
        }`
      );
      this.redirectLoginError(res, 'oidc-erreur-interne');
    }
  }

  private redirectLoginError(res: Response, code: OidcErrorCode): void {
    const appUrl = this.configurationService.get('APP_URL');
    res.redirect(303, `${appUrl}/login?erreur=${code}`);
  }
}
