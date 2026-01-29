import { Injectable } from '@nestjs/common';
import { isAuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import z from 'zod';
import { updateFicheErrorConfig } from './update-fiche.errors';
import { updateFicheInputSchema } from './update-fiche.input';
import UpdateFicheService from './update-fiche.service';

const updateFicheInput = z.object({
  ficheId: z.number(),
  ficheFields: updateFicheInputSchema,
  isNotificationEnabled: z.boolean().optional(),
});

@Injectable()
export class UpdateFicheRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: UpdateFicheService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    updateFicheErrorConfig
  );

  router = this.trpc.router({
    update: this.trpc.authedProcedure
      .input(updateFicheInput)
      .mutation(async ({ input, ctx }) => {
        if (!isAuthenticatedUser(ctx.user)) {
          throw new Error('Service role user cannot update fiche');
        }
        const result = await this.service.updateFiche({
          ficheId: input.ficheId,
          ficheFields: input.ficheFields,
          isNotificationEnabled: input.isNotificationEnabled,
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
