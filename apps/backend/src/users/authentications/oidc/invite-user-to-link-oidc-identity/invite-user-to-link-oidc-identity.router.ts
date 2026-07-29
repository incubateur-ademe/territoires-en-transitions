import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { inviteUserToLinkOidcIdentityErrorConfig } from './invite-user-to-link-oidc-identity.errors';
import { InviteUserToLinkOidcIdentityService } from './invite-user-to-link-oidc-identity.service';

const demanderRattachementInputSchema = z.object({
  ticket: z.string().min(1),
  initialMail: z.email(),
});

/**
 * Endpoint « cas Oui, mot de passe oublié » (fallback secondaire) :
 * appelé SANS session (ni ProConnect ni classique) — d'où `publicProcedure`.
 * La sécurité vient de l'anti-énumération (réponse toujours identique) et du
 * token à usage unique envoyé par email, pas d'une auth quelconque ici.
 */
@Injectable()
export class InviteUserToLinkOidcIdentityRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly demanderRattachementService: InviteUserToLinkOidcIdentityService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    inviteUserToLinkOidcIdentityErrorConfig
  );

  router = this.trpc.router({
    inviteUserToLinkIdentity: this.trpc.publicProcedure
      .input(demanderRattachementInputSchema)
      .mutation(async ({ input }) =>
        this.getResultDataOrThrowError(
          await this.demanderRattachementService.inviteUserToLinkIdentity(
            input.ticket,
            input.initialMail
          )
        )
      ),
  });
}
