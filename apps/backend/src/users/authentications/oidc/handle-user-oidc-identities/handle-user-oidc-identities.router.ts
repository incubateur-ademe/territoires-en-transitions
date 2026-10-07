import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { oidcProviderSchema } from '../oidc.models';
import { handleUserOidcIdentitiesErrorConfig } from './handle-user-oidc-identities.errors';
import { HandleUserOidcIdentitiesService } from './handle-user-oidc-identities.service';

/**
 * Gestion des identités OIDC liées depuis le profil : lister (avec les
 * providers actuellement activés, pour n'afficher que les lignes
 * pertinentes), lier volontairement (via `/:provider/login?mode=link`, cf.
 * `oidc.controller.ts`) et délier.
 */
@Injectable()
export class HandleUserOidcIdentitiesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly gererIdentitesService: HandleUserOidcIdentitiesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    handleUserOidcIdentitiesErrorConfig
  );

  router = this.trpc.router({
    listActiveProviders: this.trpc.publicProcedure.query(() =>
      this.gererIdentitesService.listActiveProviders()
    ),

    listUserIdentities: this.trpc.authedProcedure.query(
      async ({ ctx: { user } }) =>
        this.gererIdentitesService.listUserIdentities(user.id)
    ),

    unlinkIdentityFromUser: this.trpc.authedProcedure
      .input(z.object({ provider: oidcProviderSchema }))
      .mutation(async ({ input, ctx: { user } }) =>
        this.getResultDataOrThrowError(
          await this.gererIdentitesService.unlinkIdentityFromUser(
            user.id,
            input.provider
          )
        )
      ),
  });
}
