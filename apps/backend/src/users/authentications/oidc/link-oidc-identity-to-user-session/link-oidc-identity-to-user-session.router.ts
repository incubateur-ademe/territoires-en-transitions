import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { linkOidcIdentityToUserSessionErrorConfig } from './link-oidc-identity-to-user-session.errors';
import { LinkOidcIdentityToUserSessionService } from './link-oidc-identity-to-user-session.service';

const lierIdentiteParSessionInputSchema = z.object({
  ticket: z.string().min(1),
});

/**
 * Endpoint « cas Oui, re-connexion classique » : appelé juste après
 * l'authentification classique (`apps/auth`), avec la session classique déjà
 * active. `authedProcedure` fournit la seconde preuve (possession de
 * l'ancien compte) ; le ticket fournit la première (identité ProConnect).
 */
@Injectable()
export class LinkOidcIdentityToUserSessionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly lierIdentiteParSessionService: LinkOidcIdentityToUserSessionService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    linkOidcIdentityToUserSessionErrorConfig
  );

  router = this.trpc.router({
    linkIdentityToUserSession: this.trpc.authedProcedure
      .input(lierIdentiteParSessionInputSchema)
      .mutation(async ({ input, ctx: { user } }) =>
        this.getResultDataOrThrowError(
          await this.lierIdentiteParSessionService.linkIdentityToUserSession(
            user,
            input.ticket
          )
        )
      ),
  });
}
