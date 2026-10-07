import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { confirmOidcIdentityLinkedToUserErrorConfig } from './confirm-oidc-identity-linked-to-user.errors';
import { ConfirmOidcIdentityLinkedToUserService } from './confirm-oidc-identity-linked-to-user.service';

const confirmerRattachementInputSchema = z.object({
  token: z.string().min(1),
});

/**
 * Endpoint de confirmation du fallback « mot de passe oublié » : appelé
 * depuis le lien reçu par email, SANS session (`publicProcedure`) — la
 * preuve est le token à usage unique lui-même.
 */
@Injectable()
export class ConfirmOidcIdentityLinkedToUserRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly confirmerRattachementService: ConfirmOidcIdentityLinkedToUserService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    confirmOidcIdentityLinkedToUserErrorConfig
  );

  router = this.trpc.router({
    confirmIdentityLinkedToUser: this.trpc.publicProcedure
      .input(confirmerRattachementInputSchema)
      .mutation(async ({ input }) =>
        this.getResultDataOrThrowError(
          await this.confirmerRattachementService.confirmIdentityLinkedToUser(
            input.token
          )
        )
      ),
  });
}
